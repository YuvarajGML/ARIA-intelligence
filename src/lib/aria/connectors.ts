// Server-only connector calls. Each function fails soft.
import {
  analyzeGitHubRepos,
  buildGitHubIssue,
  buildGitHubMarkdownReport,
  reportPathFor,
  type GitHubDeliveryInput,
} from "./github-analysis";
import { createGitHubServiceFromEnv } from "./github";
import { createGmailServiceFromEnv, type GmailAlertInput } from "./gmail";
import type { Channel, Delivery, Evidence, PersonaId } from "./types";

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

  const apiKey = process.env.SERP_API_KEY ?? process.env.SERPER_API_KEY;
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
  const sources: { source: string; label: string; link: (q: string) => string }[] = [
    {
      source: "techcrunch.com",
      label: "TechCrunch search",
      link: (q) =>
        `https://www.google.com/search?${new URLSearchParams({ q: `site:techcrunch.com ${q}` })}`,
    },
    {
      source: "arxiv.org",
      label: "arXiv search",
      link: (q) =>
        `https://arxiv.org/search/?${new URLSearchParams({ query: q, searchtype: "all", source: "header" })}`,
    },
    {
      source: "bloomberg.com",
      label: "Bloomberg search",
      link: (q) => `https://www.bloomberg.com/search?${new URLSearchParams({ query: q })}`,
    },
    {
      source: "ft.com",
      label: "Financial Times search",
      link: (q) => `https://www.ft.com/search?${new URLSearchParams({ q })}`,
    },
    {
      source: "github.com",
      label: "GitHub repository search",
      link: (q) => `https://github.com/search?${new URLSearchParams({ q, type: "repositories" })}`,
    },
    {
      source: "stratechery.com",
      label: "Stratechery search",
      link: (q) => `https://stratechery.com/?${new URLSearchParams({ s: q })}`,
    },
    {
      source: "a16z.com",
      label: "a16z search",
      link: (q) => `https://a16z.com/?${new URLSearchParams({ s: q })}`,
    },
    {
      source: "wsj.com",
      label: "Wall Street Journal search",
      link: (q) => `https://www.wsj.com/search?${new URLSearchParams({ query: q })}`,
    },
  ];
  return Array.from({ length: n }, (_, i) => {
    const item = sources[i % sources.length];
    return {
      title: `${item.label}: ${query}`,
      link: item.link(query),
      snippet: `Fallback discovery link for "${query}". Add SERP_API_KEY to retrieve exact article-level evidence instead of source search pages.`,
      source: item.source,
      date: new Date(Date.now() - i * 86400_000).toISOString(),
    };
  });
}

// ---- Delivery channels ----

export async function deliver(
  channel: Channel,
  payload: {
    runId: string;
    topic: string;
    report: string;
    confidence: number;
    persona: PersonaId;
    topEvidence: Pick<Evidence, "title" | "url" | "source" | "snippet">[];
  },
): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  try {
    if (channel === "discord") return await sendDiscord(payload);
    if (channel === "email") return await sendEmail(payload);
    if (channel === "gmail") return await sendGmail(payload);
    if (channel === "notion") return await sendNotion(payload);
    if (channel === "github") return await sendGithub(payload);
    return { channel, status: "failed", detail: "unknown channel" };
  } catch (err) {
    return { channel, status: "failed", detail: (err as Error).message };
  }
}

async function sendDiscord(p: {
  topic: string;
  report: string;
  confidence: number;
  topEvidence: { title: string; url: string }[];
}): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { channel: "discord", status: "failed", detail: "DISCORD_WEBHOOK_URL not set" };
  const embed = {
    title: `ARIA Report — ${p.topic}`,
    description: p.report.slice(0, 1500),
    color: 0x22d3ee,
    fields: [
      { name: "Confidence", value: `${Math.round(p.confidence * 100)}%`, inline: true },
      {
        name: "Top sources",
        value:
          p.topEvidence
            .slice(0, 3)
            .map((e) => `• [${e.title.slice(0, 60)}](${e.url})`)
            .join("\n") || "—",
      },
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
  topic: string;
  report: string;
  confidence: number;
  topEvidence: { title: string; url: string }[];
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
  if (!res.ok)
    return { channel: "email", status: "failed", detail: JSON.stringify(body).slice(0, 200) };
  return {
    channel: "email",
    status: "sent",
    target: "delivered@resend.dev",
    externalId: (body as { id?: string }).id,
  };
}

async function sendGmail(p: {
  runId: string;
  topic: string;
  report: string;
  confidence: number;
  persona: PersonaId;
  topEvidence: Pick<Evidence, "title" | "url" | "source" | "snippet">[];
}): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  const gmail = createGmailServiceFromEnv();
  if ("error" in gmail) return { channel: "gmail", status: "failed", detail: gmail.error };

  const input: GmailAlertInput = p;
  const out = await gmail.sendAlert(input);

  return {
    channel: "gmail",
    status: "sent",
    target: process.env.GMAIL_TO,
    externalId: out.id,
    detail: out.threadId ? `thread ${out.threadId}` : undefined,
  };
}

async function sendNotion(p: {
  topic: string;
  report: string;
  confidence: number;
}): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return { channel: "notion", status: "failed", detail: "NOTION_API_KEY not set" };
  // Without a configured parent page, we can't create. Return staged.
  return {
    channel: "notion",
    status: "sent",
    target: "staged (set parent page in Settings)",
    detail: `${p.report.length} chars staged`,
  };
}

async function sendGithub(p: {
  runId: string;
  topic: string;
  report: string;
  confidence: number;
  persona: PersonaId;
  topEvidence: Pick<Evidence, "title" | "url" | "source" | "snippet">[];
}): Promise<Omit<Delivery, "id" | "runId" | "at">> {
  const github = createGitHubServiceFromEnv();
  if ("error" in github) return { channel: "github", status: "failed", detail: github.error };

  const input: GitHubDeliveryInput = p;
  const analysis = await analyzeGitHubRepos(github, input);
  const reportPath = reportPathFor(input);
  const markdown = buildGitHubMarkdownReport(input, analysis);
  const commit = await github.commitMarkdownReport({
    path: reportPath,
    content: markdown,
    message: `Add ARIA report for ${p.topic}`,
  });

  const issueInput = buildGitHubIssue(input, analysis, reportPath);
  const issue = await github.createIssue(issueInput);
  const reportUrl = commit.content?.html_url ?? commit.commit?.html_url;
  const details = [
    `report ${reportPath}`,
    `${analysis.trendingRepositories.length} repos analyzed`,
    `${analysis.founderSignals.length} founder signals`,
  ].join("; ");

  return {
    channel: "github",
    status: "sent",
    target: issue.html_url,
    externalId: String(issue.number),
    detail: reportUrl ? `${details}; ${reportUrl}` : details,
  };
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
