// Multi-agent mock engine. Server-only.
// Researcher → Validator → Critic (maybe retry) → Synthesizer → Deliverer.
import { PERSONAS } from "./personas";
import { deliver, serperSearch } from "./connectors";
import { pushEvent, setStatus, getRun, getReport } from "./store";
import type { AgentName, AriaEvent, Channel, Evidence, RunRequest } from "./types";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const jitter = (a: number, b: number) => a + Math.random() * (b - a);
const id = () => Math.random().toString(36).slice(2, 10);

function emit(runId: string, e: Record<string, unknown> & { type: AriaEvent["type"] }) {
  pushEvent(runId, { ...(e as object), at: Date.now() } as AriaEvent);
}

async function thinkStream(runId: string, agent: AgentName, text: string) {
  const tokens = text.split(/(\s+)/);
  for (const t of tokens) {
    if (!t) continue;
    emit(runId, { type: "agent.thinking", agent, token: t });
    await sleep(jitter(40, 120));
  }
}

async function callGrokAI(
  messages: { role: string; content: string }[],
  onToken: (t: string) => void,
) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    onToken("(GROK_API_KEY not configured - emitting placeholder report)\n");
    return;
  }
  const config = getGrokConfig(apiKey);
  try {
    const res = await fetch(config.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        stream: true,
        temperature: 0.4,
        messages,
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      onToken(`(Grok API error ${res.status}${body ? `: ${body.slice(0, 240)}` : ""})`);
      return;
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const j = JSON.parse(data);
          const tok = j.choices?.[0]?.delta?.content;
          if (tok) onToken(tok);
        } catch {
          /* ignore */
        }
      }
    }
  } catch (err) {
    onToken(`(Grok error: ${(err as Error).message})`);
  }
}

function getGrokConfig(apiKey: string) {
  const isGroqKey = apiKey.startsWith("gsk_");
  return {
    url:
      process.env.GROK_API_URL ??
      (isGroqKey
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.x.ai/v1/chat/completions"),
    model:
      process.env.GROK_MODEL ?? (isGroqKey ? "llama-3.3-70b-versatile" : "grok-4.20-reasoning"),
  };
}

export async function runAgentPipeline(runId: string, req: RunRequest) {
  setStatus(runId, "running");
  emit(runId, { type: "run.started", runId, topic: req.topic, persona: req.persona });

  const persona = PERSONAS[req.persona];
  let confidence = 0;
  let attempt = 0;
  const evidence: Evidence[] = [];
  let verdictPassed = false;

  try {
    // Researcher loop with possible retry
    while (!verdictPassed && attempt < 2) {
      attempt++;

      // Researcher
      emit(runId, { type: "agent.started", agent: "Researcher" });
      await thinkStream(
        runId,
        "Researcher",
        attempt === 1
          ? `Decomposing query "${req.topic}" into ${req.depth} sub-queries for ${persona.label} persona.`
          : `Refining queries based on critic feedback. Targeting authoritative + recent sources.`,
      );

      const subQueries = buildSubQueries(req.topic, req.depth, attempt > 1);
      for (const q of subQueries) {
        emit(runId, {
          type: "agent.tool_call",
          agent: "Researcher",
          tool: "serper.search",
          args: { q },
        });
        const t0 = Date.now();
        const results = await serperSearch(q, 5 + req.depth);
        emit(runId, {
          type: "agent.tool_result",
          agent: "Researcher",
          tool: "serper.search",
          ok: true,
          latency_ms: Date.now() - t0,
        });
        for (const r of results.slice(0, 4)) {
          const ev: Evidence = {
            id: id(),
            url: r.link,
            title: r.title,
            snippet: r.snippet,
            source: r.source ?? "web",
            score: 0,
            publishedAt: r.date,
          };
          evidence.push(ev);
          emit(runId, { type: "evidence.added", evidence: ev });
          await sleep(jitter(80, 180));
        }
      }
      emit(runId, { type: "agent.completed", agent: "Researcher" });
      await sleep(300);

      // Validator
      emit(runId, { type: "agent.started", agent: "Validator" });
      await thinkStream(
        runId,
        "Validator",
        "Scoring sources by recency, authority, and relevance.",
      );
      for (const ev of evidence) {
        const recency = ev.publishedAt
          ? Math.max(0, 1 - (Date.now() - new Date(ev.publishedAt).getTime()) / (90 * 86400_000))
          : 0.4;
        const authority = /arxiv|bloomberg|ft|wsj|stratechery|a16z|nature|nytimes|reuters/.test(
          ev.source,
        )
          ? 0.9
          : 0.55;
        const relevance = 0.5 + Math.random() * 0.5;
        ev.score = +(0.4 * authority + 0.3 * recency + 0.3 * relevance).toFixed(2);
      }
      // drop weakest
      evidence.sort((a, b) => b.score - a.score);
      const dropped = evidence.splice(Math.max(6, evidence.length - 2));
      emit(runId, {
        type: "agent.tool_call",
        agent: "Validator",
        tool: "score.evidence",
        args: { kept: evidence.length, dropped: dropped.length },
      });
      emit(runId, {
        type: "agent.tool_result",
        agent: "Validator",
        tool: "score.evidence",
        ok: true,
        latency_ms: 240,
      });
      confidence = +(
        evidence.reduce((s, e) => s + e.score, 0) / Math.max(1, evidence.length)
      ).toFixed(2);
      emit(runId, { type: "confidence.updated", score: confidence });
      emit(runId, { type: "agent.completed", agent: "Validator" });
      await sleep(300);

      // Critic
      emit(runId, { type: "agent.started", agent: "Critic" });
      await thinkStream(
        runId,
        "Critic",
        "Auditing coverage, contradictions, and source diversity.",
      );
      const passed = attempt > 1 || (confidence >= 0.62 && Math.random() > 0.25);
      const reasons = passed
        ? [
            "Sufficient source diversity",
            "No major contradictions",
            `Confidence ${Math.round(confidence * 100)}% ≥ threshold`,
          ]
        : [
            "Coverage gap on recent quarter",
            "Low source diversity",
            "Schedule refined re-research",
          ];
      emit(runId, { type: "critic.verdict", verdict: { score: confidence, passed, reasons } });
      emit(runId, { type: "agent.completed", agent: "Critic" });
      verdictPassed = passed;
      if (!passed) {
        emit(runId, { type: "retry.scheduled", attempt: attempt + 1, reason: reasons.join("; ") });
        await sleep(600);
      }
    }

    // Synthesizer
    emit(runId, { type: "agent.started", agent: "Synthesizer" });
    await thinkStream(
      runId,
      "Synthesizer",
      `Drafting ${persona.label.toLowerCase()} report with ${evidence.length} validated sources.`,
    );
    const sourcesBlock = evidence
      .slice(0, 8)
      .map((e, i) => `[${i + 1}] ${e.title} — ${e.source} (${e.url})`)
      .join("\n");
    const userPrompt = `Topic: ${req.topic}

Required sections: ${persona.sections.join(", ")}

Validated sources:
${sourcesBlock}

Write a ${persona.tone} ${persona.label} report (max ~600 words). Use markdown headings for each section. Cite sources inline as [1], [2], etc. End with a "Sources" list.`;

    emit(runId, {
      type: "agent.tool_call",
      agent: "Synthesizer",
      tool: "grok.chat.stream",
      args: { model: getGrokConfig(process.env.GROK_API_KEY ?? "").model },
    });
    const t0 = Date.now();
    await callGrokAI(
      [
        { role: "system", content: persona.systemPrompt },
        { role: "user", content: userPrompt },
      ],
      (tok) => emit(runId, { type: "report.chunk", token: tok }),
    );
    emit(runId, {
      type: "agent.tool_result",
      agent: "Synthesizer",
      tool: "grok.chat.stream",
      ok: true,
      latency_ms: Date.now() - t0,
    });
    emit(runId, { type: "agent.completed", agent: "Synthesizer" });
    await sleep(300);

    // Deliverer
    if (req.channels.length > 0) {
      emit(runId, { type: "agent.started", agent: "Deliverer" });
      const report = getReport(runId);
      const top = evidence.slice(0, 5).map((e) => ({
        title: e.title,
        url: e.url,
        source: e.source,
        snippet: e.snippet,
      }));
      for (const ch of req.channels) {
        emit(runId, { type: "agent.tool_call", agent: "Deliverer", tool: `${ch}.send`, args: {} });
        const t1 = Date.now();
        const out = await deliver(ch as Channel, {
          runId,
          topic: req.topic,
          report,
          confidence,
          persona: req.persona,
          topEvidence: top,
        });
        emit(runId, {
          type: "agent.tool_result",
          agent: "Deliverer",
          tool: `${ch}.send`,
          ok: out.status === "sent",
          latency_ms: Date.now() - t1,
        });
        emit(runId, {
          type: "delivery.sent",
          delivery: { id: id(), runId, at: new Date().toISOString(), ...out },
        });
        await sleep(250);
      }
      emit(runId, { type: "agent.completed", agent: "Deliverer" });
    }

    emit(runId, { type: "run.completed" });
  } catch (err) {
    emit(runId, { type: "run.failed", error: (err as Error).message });
  }
}

function buildSubQueries(topic: string, depth: number, refined: boolean): string[] {
  const base = [
    topic,
    `${topic} latest news 2026`,
    `${topic} analysis`,
    `${topic} competitors market share`,
    `${topic} risks challenges`,
  ];
  if (refined) {
    return [
      `${topic} site:arxiv.org OR site:bloomberg.com last 90 days`,
      `${topic} primary source 2026`,
      `${topic} contrarian view`,
    ].slice(0, Math.max(2, depth));
  }
  return base.slice(0, Math.max(2, Math.min(5, depth + 1)));
}

// Idempotent kickoff: only spawns once per run id.
const STARTED = new Set<string>();
export function ensureRun(runId: string, req: RunRequest) {
  if (STARTED.has(runId)) return;
  STARTED.add(runId);
  // fire and forget
  runAgentPipeline(runId, req).catch((err) => {
    emit(runId, { type: "run.failed", error: (err as Error).message });
  });
}

export function isStarted(runId: string) {
  const rec = getRun(runId);
  return STARTED.has(runId) || rec?.run.status !== "pending";
}
