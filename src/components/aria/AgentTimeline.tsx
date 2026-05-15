import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Check,
  CircleDashed,
  Radio,
  ScanSearch,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AgentName, AriaEvent } from "@/lib/aria/types";

const AGENTS: {
  name: AgentName;
  role: string;
  tools: string[];
  color: string;
  icon: typeof Brain;
}[] = [
  {
    name: "Researcher",
    role: "Signal acquisition",
    tools: ["serper.search"],
    color: "oklch(0.78 0.16 200)",
    icon: ScanSearch,
  },
  {
    name: "Validator",
    role: "Evidence scoring",
    tools: ["score.evidence"],
    color: "oklch(0.75 0.16 280)",
    icon: ShieldCheck,
  },
  {
    name: "Critic",
    role: "Risk audit",
    tools: ["audit"],
    color: "oklch(0.82 0.16 75)",
    icon: CircleDashed,
  },
  {
    name: "Synthesizer",
    role: "Narrative assembly",
    tools: ["grok.chat.stream"],
    color: "oklch(0.78 0.16 155)",
    icon: Sparkles,
  },
  {
    name: "Deliverer",
    role: "Channel dispatch",
    tools: ["email.send", "gmail.send", "discord.send", "github.send"],
    color: "oklch(0.78 0.16 25)",
    icon: Send,
  },
];

interface AgentState {
  status: "idle" | "running" | "done";
  lastTool?: string;
  toolCount: number;
  thinkingPreview: string;
}

export function AgentTimeline({ events }: { events: AriaEvent[] }) {
  const [view, setView] = useState<"orbit" | "grid">("orbit");
  const states = useAgentStates(events);
  const activeIndex = Math.max(
    0,
    AGENTS.findIndex((agent) => states.get(agent.name)?.status === "running"),
  );
  const completed = AGENTS.filter((agent) => states.get(agent.name)?.status === "done").length;

  return (
    <div className="glass-panel premium-card liquid-border rounded-2xl p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="section-kicker text-muted-foreground">Agent pipeline</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {completed}/5 agents complete · signal handoff visualized in real time
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.045] p-1">
          {(["orbit", "grid"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`relative rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                view === mode ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {view === mode && (
                <motion.span
                  layoutId="agent-tab"
                  className="absolute inset-0 rounded-full bg-primary/15 shadow-[inset_0_0_0_1px_oklch(0.78_0.16_200_/_0.22)]"
                />
              )}
              <span className="relative">{mode}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "orbit" ? (
          <motion.div
            key="orbit"
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
            transition={{ duration: 0.35 }}
          >
            <OrbitFlow states={states} activeIndex={activeIndex} />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-5"
          >
            {AGENTS.map((agent, index) => (
              <AgentTile
                key={agent.name}
                agent={agent}
                state={states.get(agent.name)!}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrbitFlow({
  states,
  activeIndex,
}: {
  states: Map<AgentName, AgentState>;
  activeIndex: number;
}) {
  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20 p-4 sm:p-6">
      <div className="absolute inset-0 neural-lines opacity-25" />
      <div className="absolute left-8 right-8 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent sm:block" />
      <motion.div
        className="absolute top-1/2 hidden h-3 w-3 rounded-full bg-primary shadow-[0_0_30px_oklch(0.78_0.16_200)] sm:block"
        animate={{ left: `${8 + activeIndex * 21}%` }}
        transition={{ type: "spring", stiffness: 48, damping: 18, mass: 0.9 }}
      />
      <motion.div
        className="absolute top-1/2 hidden h-20 w-20 -translate-y-1/2 rounded-full bg-primary/10 blur-xl sm:block"
        animate={{ left: `calc(${8 + activeIndex * 21}% - 2.25rem)` }}
        transition={{ type: "spring", stiffness: 36, damping: 18, mass: 1.1 }}
      />

      <div className="relative grid gap-3 sm:grid-cols-5 sm:pt-20">
        {AGENTS.map((agent, index) => {
          const state = states.get(agent.name)!;
          return (
            <motion.div
              key={agent.name}
              animate={{
                y: index === activeIndex ? -14 : 0,
                opacity: state.status === "idle" ? 0.72 : 1,
              }}
              transition={{ type: "spring", stiffness: 110, damping: 18 }}
            >
              <AgentStage
                agent={agent}
                state={state}
                active={index === activeIndex}
                index={index}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AgentStage({
  agent,
  state,
  active,
  index,
}: {
  agent: (typeof AGENTS)[number];
  state: AgentState;
  active: boolean;
  index: number;
}) {
  const Icon = agent.icon;
  const done = state.status === "done";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      className={`liquid-border premium-card min-h-[180px] rounded-2xl border p-4 ${
        active
          ? "border-primary/45 bg-primary/[0.075]"
          : done
            ? "border-success/25 bg-success/[0.04]"
            : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10"
          style={{
            color: agent.color,
            backgroundColor: `color-mix(in oklab, ${agent.color} 13%, transparent)`,
            boxShadow: active
              ? `0 0 30px color-mix(in oklab, ${agent.color} 30%, transparent)`
              : undefined,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        {done ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <Radio className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
        )}
      </div>
      <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {agent.role}
      </div>
      <div className="mt-1 text-sm font-semibold">{agent.name}</div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          animate={{ width: done ? "100%" : active ? "62%" : "10%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-success"
        />
      </div>
      <div className="mt-3 h-8 text-[10px] leading-4 text-muted-foreground">
        {state.lastTool ?? state.thinkingPreview.trim() ?? agent.tools[0]}
      </div>
    </motion.div>
  );
}

function AgentTile({
  agent,
  state,
  index,
}: {
  agent: (typeof AGENTS)[number];
  state: AgentState;
  index: number;
}) {
  const running = state.status === "running";
  const done = state.status === "done";
  const Icon = agent.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="premium-card liquid-border flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-center"
    >
      <motion.div
        animate={running ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 1.2, repeat: running ? Infinity : 0 }}
        className={`relative mb-2 flex h-12 w-12 items-center justify-center rounded-full border ${
          running ? "pulse-ring" : ""
        }`}
        style={{
          borderColor: done || running ? agent.color : "oklch(0.30 0.02 260 / 0.6)",
          backgroundColor:
            done || running
              ? `color-mix(in oklab, ${agent.color} 18%, transparent)`
              : "transparent",
        }}
      >
        <Icon className="h-4 w-4" style={{ color: done || running ? agent.color : undefined }} />
        {done && (
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card bg-success text-[8px] font-bold text-background">
            ✓
          </span>
        )}
      </motion.div>
      <div className="font-mono text-[11px] font-medium">{agent.name}</div>
      <div className="mt-0.5 h-3 font-mono text-[9px] text-muted-foreground">
        {state.lastTool ? `${state.lastTool} x${state.toolCount}` : "-"}
      </div>
    </motion.div>
  );
}

function useAgentStates(events: AriaEvent[]) {
  return useMemo(() => {
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
}
