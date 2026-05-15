import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, BrainCircuit, Radio, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/aria/AppShell";
import { RunComposer } from "@/components/aria/RunComposer";
import { RunCard } from "@/components/aria/RunCard";
import { Button } from "@/components/ui/button";
import type { Run } from "@/lib/aria/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARIA - Autonomous Intelligence Control Room" },
      {
        name: "description",
        content:
          "Multi-agent autonomous research, validated and delivered. Watch agents reason live.",
      },
      { property: "og:title", content: "ARIA - Autonomous Intelligence" },
      { property: "og:description", content: "Multi-agent research, validated and delivered." },
    ],
  }),
  component: Page,
});

const PRESETS = [
  {
    topic: "OpenAI gpt-5 launch - what it changes for vertical AI startups",
    persona: "founder" as const,
  },
  {
    topic: "Diffusion world models 2026 - current SOTA and open problems",
    persona: "student" as const,
  },
  { topic: "Cursor's enterprise traction and pricing strategy", persona: "investor" as const },
];

const CAPABILITIES = [
  { label: "Research", value: "Live web", icon: Radio },
  { label: "Validation", value: "Critic loop", icon: ShieldCheck },
  { label: "Delivery", value: "Discord · Gmail · GitHub", icon: Zap },
];

function Page() {
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    let alive = true;
    const fetchRuns = async () => {
      const r = await fetch("/api/aria/runs");
      const j = await r.json();
      if (alive) setRuns(j.runs);
    };
    fetchRuns();
    const id = setInterval(fetchRuns, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const active = runs.filter((r) => r.status === "running" || r.status === "pending");
  const recent = runs.filter((r) => r.status === "completed" || r.status === "failed").slice(0, 12);
  const stats = useMemo(
    () => [
      { label: "Runs", value: runs.length },
      { label: "Active", value: active.length },
      {
        label: "Avg confidence",
        value:
          runs.length > 0
            ? `${Math.round((runs.reduce((sum, run) => sum + run.confidence, 0) / runs.length) * 100)}%`
            : "0%",
      },
    ],
    [active.length, runs],
  );

  return (
    <AppShell>
      <div className="space-y-10">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2rem] glass-panel animated-border p-5 sm:p-8 lg:p-10"
        >
          <div className="absolute inset-0 neural-lines opacity-30" />
          <div className="absolute -right-16 top-8 hidden h-72 w-72 rounded-full bg-primary/15 blur-3xl md:block" />
          <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="section-kicker mb-4 flex items-center gap-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Autonomous research operating system
              </motion.div>
              <h1 className="hero-title max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Intelligence that moves from signal to action.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Dispatch a live five-agent pipeline that researches, validates, critiques,
                synthesizes, and delivers findings to your team channels with production-grade
                traceability.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#dispatch">
                  <Button size="lg" className="magnetic-button glow-primary gap-2 font-mono">
                    Dispatch agents <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#recent">
                  <Button
                    variant="outline"
                    size="lg"
                    className="magnetic-button border-white/15 bg-white/5 font-mono"
                  >
                    View telemetry
                  </Button>
                </a>
              </div>

              <div className="mt-8 grid max-w-xl grid-cols-3 gap-2">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur"
                  >
                    <div className="font-mono text-2xl font-semibold text-foreground">
                      {stat.value}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, rotateX: 8 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative min-h-[360px] rounded-[1.7rem] border border-white/10 bg-background/40 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute inset-0 rounded-[1.7rem] bg-gradient-to-br from-primary/15 via-transparent to-success/10" />
              <div className="relative flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warn/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  Live mesh
                </div>
              </div>
              <div className="relative mt-5 grid gap-3">
                {CAPABILITIES.map(({ label, value, icon: Icon }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.32 + index * 0.1 }}
                    className="premium-card flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                      </div>
                      <div className="truncate text-sm font-medium">{value}</div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_18px_oklch(0.78_0.16_155)]" />
                  </motion.div>
                ))}
              </div>
              <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Agent throughput
                  </div>
                  <BrainCircuit className="h-4 w-4 text-primary" />
                </div>
                <div className="flex h-24 items-end gap-2">
                  {[46, 62, 38, 84, 71, 92, 58, 76, 88, 66, 95, 81].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 4 }}
                      animate={{ height }}
                      transition={{
                        delay: 0.4 + index * 0.035,
                        type: "spring",
                        stiffness: 120,
                        damping: 18,
                      }}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary/35 to-success/80"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          id="dispatch"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="scroll-mt-24"
        >
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="section-kicker">Launch console</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Mission control</h2>
            </div>
          </div>
          <RunComposer />
        </motion.section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-kicker">Demo presets</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {PRESETS.map((p, index) => (
              <PresetButton key={p.topic} topic={p.topic} persona={p.persona} index={index} />
            ))}
          </div>
        </section>

        {active.length > 0 && (
          <section>
            <h2 className="section-kicker mb-3 text-primary">● Active · {active.length}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {active.map((r) => (
                <RunCard key={r.id} run={r} />
              ))}
            </div>
          </section>
        )}

        <section id="recent" className="scroll-mt-24">
          <h2 className="section-kicker mb-3">Recent runs</h2>
          {recent.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">
              No runs yet. Dispatch one above or pick a demo preset.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recent.map((r) => (
                <RunCard key={r.id} run={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function PresetButton({
  topic,
  persona,
  index,
}: {
  topic: string;
  persona: "founder" | "student" | "investor";
  index: number;
}) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const res = await fetch("/api/aria/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, persona, depth: 3, channels: ["discord"] }),
      });
      const j = await res.json();
      window.location.href = `/runs/${j.run.id}`;
    } finally {
      setBusy(false);
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
    >
      <Button
        variant="outline"
        onClick={go}
        disabled={busy}
        className="magnetic-button premium-card h-full w-full items-start gap-1 rounded-2xl border-white/10 bg-white/[0.045] px-4 py-4 text-left backdrop-blur hover:border-primary/40"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
          {persona}
        </span>
        <span className="whitespace-normal text-xs text-foreground">{topic}</span>
      </Button>
    </motion.div>
  );
}
