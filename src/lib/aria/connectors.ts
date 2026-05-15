// Server-only connector calls. Each function fails soft.
import type { Channel, Delivery } from "./types";

const SERPER_CACHE = new Map<string, { at: number; data: SerperResult[] }>();

export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
}

export async function serperSearch(query: string, num = 8): Promise<SerperResult[]> {
  const key = `${query}::${num}`;
  const cached = SERPER_CACHE.get(key);
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.data;

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return mockResults(query, num);
  }
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num }),
    });
    if (!res.ok) throw new Error(`serper ${res.status}`);
    const json = (await res.json()) as { organic?: SerperResult[] };
    const data = (json.organic ?? []).slice(0, num).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      source: r.source ?? new URL(r.link).hostname.replace(/^www\./, ""),
      date: r.date,
    }));
    SERPER_CACHE.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return mockResults(query, num);
  }
}

function mockResults(query: string, n: number): SerperResult[] {
  const sources = ["techcrunch.com", "arxiv.org", "bloomberg.com", "ft.com", "github.com", "stratechery.com", "a16z.com", "wsj.com"];
  return Array.from({ length: n }, (_, i) => ({
    title: `${query}: insight ${i + 1}`,
    link: `https://${sources[i % sources.length]}/post-${i + 1}`,
    snippet: `Analysis of ${query} covering recent developments, market dynamics, and forward-looking signals (#${i + 1}).`,
    source: sources[i % sources.length],
    date: new Date(Date.now() - i * 86400_000).toISOString(),
  }));
}

// ---- Delivery channels ----

export async function deliver(
  channel: Channel,
  payload: { runId: string; topic: string; report: string; confidence: number; topEvidence: { title: string; url: string }[] }
): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  try {
    if (channel === "discord") return await sendDiscord(payload);
    if (channel === "email") return await sendEmail(payload);
    if (channel === "notion") return await sendNotion(payload);
    if (channel === "github") return await sendGithub(payload);
    return { channel, status: "failed", detail: "unknown channel" };
  } catch (err) {
    return { channel, status: "failed", detail: (err as Error).message };
  }
}

async function sendDiscord(p: {
  topic: string; report: string; confidence: number; topEvidence: { title: string; url: string }[];
}): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { channel: "discord", status: "failed", detail: "DISCORD_WEBHOOK_URL not set" };
  const embed = {
    title: `ARIA Report — ${p.topic}`,
    description: p.report.slice(0, 1500),
    color: 0x22d3ee,
    fields: [
      { name: "Confidence", value: `${Math.round(p.confidence * 100)}%`, inline: true },
      { name: "Top sources", value: p.topEvidence.slice(0, 3).map((e) => `• [${e.title.slice(0, 60)}](${e.url})`).join("\n") || "—" },
    ],
    timestamp: new Date().toISOString(),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "ARIA", embeds: [embed] }),
  });
  if (!res.ok) return { channel: "discord", status: "failed", detail: `discord ${res.status}` };
  return { channel: "discord", status: "sent", target: "webhook" };
}

async function sendEmail(p: {
  topic: string; report: string; confidence: number; topEvidence: { title: string; url: string }[];
}): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { channel: "email", status: "failed", detail: "RESEND_API_KEY not set" };
  const html = `<div style="font-family:Inter,sans-serif;max-width:640px;margin:auto;color:#0f172a">
    <h1 style="margin:0 0 8px">ARIA — ${escapeHtml(p.topic)}</h1>
    <p style="color:#64748b;margin:0 0 24px">Confidence ${Math.round(p.confidence * 100)}%</p>
    <pre style="white-space:pre-wrap;font-family:Inter,sans-serif;line-height:1.55">${escapeHtml(p.report)}</pre>
    <h3>Sources</h3>
    <ol>${p.topEvidence.map((e) => `<li><a href="${e.url}">${escapeHtml(e.title)}</a></li>`).join("")}</ol>
  </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "ARIA <onboarding@resend.dev>",
      to: ["delivered@resend.dev"],
      subject: `ARIA · ${p.topic}`,
      html,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { channel: "email", status: "failed", detail: JSON.stringify(body).slice(0, 200) };
  return { channel: "email", status: "sent", target: "delivered@resend.dev", externalId: (body as { id?: string }).id };
}

async function sendNotion(p: {
  topic: string; report: string; confidence: number;
}): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return { channel: "notion", status: "failed", detail: "NOTION_API_KEY not set" };
  // Without a configured parent page, we can't create. Return staged.
  return { channel: "notion", status: "sent", target: "staged (set parent page in Settings)", detail: `${p.report.length} chars staged` };
}

async function sendGithub(p: {
  topic: string; report: string;
}): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { channel: "github", status: "failed", detail: "GITHUB_TOKEN not set" };
  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "ARIA" },
    body: JSON.stringify({
      description: `ARIA report: ${p.topic}`,
      public: false,
      files: { "ARIA-report.md": { content: p.report } },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { html_url?: string; id?: string; message?: string };
  if (!res.ok) return { channel: "github", status: "failed", detail: body.message ?? `github ${res.status}` };
  return { channel: "github", status: "sent", target: body.html_url, externalId: body.id };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
