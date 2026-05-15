import { PERSONAS } from "./personas";
import type { Evidence, PersonaId } from "./types";

interface GmailTokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface GmailSendResponse {
  id?: string;
  threadId?: string;
}

export interface GmailAlertInput {
  runId: string;
  topic: string;
  report: string;
  confidence: number;
  persona: PersonaId;
  topEvidence: Pick<Evidence, "title" | "url" | "source" | "snippet">[];
}

interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  from: string;
  to: string[];
}

export class GmailService {
  private readonly config: GmailConfig;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  async sendAlert(input: GmailAlertInput): Promise<GmailSendResponse> {
    const accessToken = await this.getAccessToken();
    const subject = `[ARIA] ${PERSONAS[input.persona].label} alert: ${input.topic}`;
    const html = buildGmailHtml(input);
    const text = buildGmailText(input);
    const raw = buildRawMessage({
      from: this.config.from,
      to: this.config.to,
      subject,
      text,
      html,
    });

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    const body = (await res.json().catch(() => ({}))) as GmailSendResponse & {
      error?: { message?: string };
    };

    if (!res.ok) {
      throw new Error(body.error?.message ?? `gmail ${res.status}`);
    }

    return body;
  }

  private async getAccessToken(): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: "refresh_token",
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json().catch(() => ({}))) as GmailTokenResponse;

    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description ?? data.error ?? `gmail token ${res.status}`);
    }

    return data.access_token;
  }
}

export function createGmailServiceFromEnv(): GmailService | { error: string } {
  const required = {
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    from: process.env.GMAIL_FROM,
    to: process.env.GMAIL_TO,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => envNameFor(key));

  if (missing.length > 0) return { error: `${missing.join(", ")} not set` };

  return new GmailService({
    clientId: required.clientId!,
    clientSecret: required.clientSecret!,
    refreshToken: required.refreshToken!,
    from: required.from!,
    to: splitRecipients(required.to!),
  });
}

function buildGmailHtml(input: GmailAlertInput): string {
  const persona = PERSONAS[input.persona];
  const sources = input.topEvidence.length
    ? input.topEvidence
        .map(
          (e) =>
            `<li><a href="${escapeAttr(e.url)}">${escapeHtml(e.title)}</a>${e.source ? ` - ${escapeHtml(e.source)}` : ""}</li>`,
        )
        .join("")
    : "<li>No source links captured.</li>";

  return `<div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;color:#111827;line-height:1.55">
    <p style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:0 0 8px">ARIA ${escapeHtml(persona.label)} alert</p>
    <h1 style="font-size:24px;line-height:1.2;margin:0 0 8px">${escapeHtml(input.topic)}</h1>
    <p style="margin:0 0 20px;color:#475569">Confidence <strong>${Math.round(input.confidence * 100)}%</strong> · Run <code>${escapeHtml(input.runId)}</code></p>
    <h2 style="font-size:16px;margin:22px 0 8px">Report</h2>
    <pre style="white-space:pre-wrap;font-family:Inter,Arial,sans-serif;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px">${escapeHtml(input.report.trim() || "No report text was generated.")}</pre>
    <h2 style="font-size:16px;margin:22px 0 8px">Sources</h2>
    <ol>${sources}</ol>
  </div>`;
}

function buildGmailText(input: GmailAlertInput): string {
  const persona = PERSONAS[input.persona];
  const sources = input.topEvidence.length
    ? input.topEvidence.map((e, i) => `${i + 1}. ${e.title} - ${e.url}`).join("\n")
    : "No source links captured.";

  return `ARIA ${persona.label} alert: ${input.topic}

Confidence: ${Math.round(input.confidence * 100)}%
Run ID: ${input.runId}

${input.report.trim() || "No report text was generated."}

Sources:
${sources}
`;
}

function buildRawMessage(input: {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
}): string {
  const boundary = `aria_${Date.now().toString(36)}`;
  const message = [
    `From: ${input.from}`,
    `To: ${input.to.join(", ")}`,
    `Subject: ${encodeHeader(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    input.text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    input.html,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  return base64Url(message);
}

function splitRecipients(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function envNameFor(key: string): string {
  return {
    clientId: "GMAIL_CLIENT_ID",
    clientSecret: "GMAIL_CLIENT_SECRET",
    refreshToken: "GMAIL_REFRESH_TOKEN",
    from: "GMAIL_FROM",
    to: "GMAIL_TO",
  }[key]!;
}

function encodeHeader(value: string): string {
  return isAscii(value) ? value : `=?UTF-8?B?${base64(value)}?=`;
}

function isAscii(value: string): boolean {
  return [...value].every((char) => char.charCodeAt(0) <= 127);
}

function base64Url(value: string): string {
  return base64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
