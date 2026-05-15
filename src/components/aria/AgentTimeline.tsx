import type { AgentName, AriaEvent } from "@/lib/aria/types";
import { useMemo } from "react";

const AGENTS: { name: AgentName; tools: string[]; color: string }[] = [
  { name: "Researcher", tools: ["serper.search"], color: "oklch(0.78 0.16 200)" },
  { name: "Validator", tools: ["score.evidence"], color: "oklch(0.75 0.16 280)" },
  { name: "Critic", tools: ["audit"], color: "oklch(0.82 0.16 75)" },
  { name: "Synthesizer", tools: ["lovable.ai.stream"], color: "oklch(0.78 0.16 155)" },
  {
    name: "Deliverer",
    tools: ["email.send", "discord.send", "github.send"],
    color: "oklch(0.78 0.16 25)",
  },
];

interface AgentState {
  status: "idle" | "running" | "done";
  lastTool?: string;
  toolCount: number;
  thinkingPreview: string;
}

export function AgentTimeline({ events }: { events: AriaEvent[] }) {
  const states = useMemo(() => {
    const m = new Map<AgentName, AgentState>();
    for (const a of AGENTS) m.set(a.name, { status: "idle", toolCount: 0, thinkingPreview: "" });
    for (const e of events) {
      if (e.type === "agent.started") m.get(e.agent)!.status = "running";
      if (e.type === "agent.completed") m.get(e.agent)!.status = "done";
      if (e.type === "agent.tool_call") {
        const s = m.get(e.agent)!;
        s.lastTool = e.tool;
        s.toolCount++;
      }
      if (e.type === "agent.thinking") {
        const s = m.get(e.agent)!;
        s.thinkingPreview = (s.thinkingPreview + e.token).slice(-80);
      }
    }
    return m;
  }, [events]);

  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
        Agent pipeline
      </div>
      <div className="grid grid-cols-5 gap-3">
        {AGENTS.map((a) => {
          const s = states.get(a.name)!;
          const running = s.status === "running";
          const done = s.status === "done";
          return (
            <div key={a.name} className="flex flex-col items-center text-center">
              <div
                className={`relative h-12 w-12 rounded-full border flex items-center justify-center mb-2 ${
                  running ? "pulse-ring" : ""
                }`}
                style={{
                  borderColor: done || running ? a.color : "oklch(0.30 0.02 260 / 0.6)",
                  backgroundColor:
                    done || running
                      ? `color-mix(in oklab, ${a.color} 18%, transparent)`
                      : "transparent",
                }}
              >
                <span
                  className="font-mono text-[11px] font-bold"
                  style={{ color: done || running ? a.color : "oklch(0.66 0.02 250)" }}
                >
                  {a.name[0]}
                </span>
                {done && (
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-success border-2 border-card flex items-center justify-center text-[8px] text-background font-bold">
                    ✓
                  </span>
                )}
              </div>
              <div className="font-mono text-[11px] font-medium">{a.name}</div>
              <div className="font-mono text-[9px] text-muted-foreground mt-0.5 h-3">
                {s.lastTool ? `${s.lastTool} ×${s.toolCount}` : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
