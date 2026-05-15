import { useEffect, useRef } from "react";
import type { AriaEvent } from "@/lib/aria/types";

export function LiveEventLog({ events }: { events: AriaEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events.length]);

  return (
    <div className="rounded-xl border border-border bg-background/80 relative scanlines overflow-hidden">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">event stream</span>
        <span className="font-mono text-[10px] text-primary">{events.length} events</span>
      </div>
      <div ref={ref} className="p-4 font-mono text-[11px] h-72 overflow-y-auto leading-relaxed">
        {events.map((e, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-muted-foreground/50 shrink-0">{new Date(e.at).toISOString().slice(11, 19)}</span>
            <span className={colorFor(e.type)}>{format(e)}</span>
          </div>
        ))}
        {events.length === 0 && <div className="text-muted-foreground/60">awaiting first event…</div>}
      </div>
    </div>
  );
}

function colorFor(type: string) {
  if (type.startsWith("evidence")) return "text-primary";
  if (type.startsWith("critic")) return "text-warn";
  if (type.startsWith("retry")) return "text-warn";
  if (type === "delivery.sent") return "text-success";
  if (type === "run.completed") return "text-success";
  if (type === "run.failed") return "text-destructive";
  if (type === "agent.tool_call" || type === "agent.tool_result") return "text-foreground";
  if (type === "agent.thinking") return "text-muted-foreground";
  if (type.startsWith("agent")) return "text-foreground";
  return "text-muted-foreground";
}

function format(e: AriaEvent): string {
  switch (e.type) {
    case "run.started": return `▸ run started · ${e.topic}`;
    case "agent.started": return `[${e.agent}] online`;
    case "agent.completed": return `[${e.agent}] complete`;
    case "agent.thinking": return `[${e.agent}] ${e.token.replace(/\s+/g, " ")}`;
    case "agent.tool_call": return `[${e.agent}] → ${e.tool}(${shortArgs(e.args)})`;
    case "agent.tool_result": return `[${e.agent}] ← ${e.tool} ${e.ok ? "ok" : "err"} ${e.latency_ms}ms`;
    case "evidence.added": return `+ evidence "${e.evidence.title.slice(0, 60)}" · ${e.evidence.source}`;
    case "confidence.updated": return `confidence → ${Math.round(e.score * 100)}%`;
    case "critic.verdict": return `verdict ${e.verdict.passed ? "PASS" : "FAIL"} · ${e.verdict.reasons.join("; ")}`;
    case "retry.scheduled": return `↻ retry #${e.attempt} scheduled · ${e.reason}`;
    case "report.chunk": return `report ⊕ ${JSON.stringify(e.token).slice(0, 40)}`;
    case "delivery.sent": return `✓ delivered → ${e.delivery.channel} ${e.delivery.status}${e.delivery.detail ? " · " + e.delivery.detail : ""}`;
    case "run.completed": return `■ run completed`;
    case "run.failed": return `✕ run failed · ${e.error}`;
  }
}

function shortArgs(a: Record<string, unknown>): string {
  const entries = Object.entries(a).slice(0, 2);
  return entries.map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 30)}`).join(", ");
}
