import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/aria/AppShell";
import { RunComposer } from "@/components/aria/RunComposer";
import { RunCard } from "@/components/aria/RunCard";
import type { Run } from "@/lib/aria/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARIA — Autonomous Intelligence Control Room" },
      { name: "description", content: "Multi-agent autonomous research, validated and delivered. Watch agents reason live." },
      { property: "og:title", content: "ARIA — Autonomous Intelligence" },
      { property: "og:description", content: "Multi-agent research, validated and delivered." },
    ],
  }),
  component: Page,
});

const PRESETS = [
  { topic: "OpenAI gpt-5 launch — what it changes for vertical AI startups", persona: "founder" as const },
  { topic: "Diffusion world models 2026 — current SOTA and open problems", persona: "student" as const },
  { topic: "Cursor's enterprise traction and pricing strategy", persona: "investor" as const },
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
    return () => { alive = false; clearInterval(id); };
  }, []);

  const active = runs.filter((r) => r.status === "running" || r.status === "pending");
  const recent = runs.filter((r) => r.status === "completed" || r.status === "failed").slice(0, 12);

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mission control</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Dispatch a five-agent pipeline. Researcher → Validator → Critic → Synthesizer → Deliverer.
              </p>
            </div>
          </div>
          <RunComposer />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Demo presets</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <PresetButton key={p.topic} topic={p.topic} persona={p.persona} />
            ))}
          </div>
        </section>

        {active.length > 0 && (
          <section>
            <h2 className="font-mono text-sm uppercase tracking-wider text-primary mb-3">
              ● Active · {active.length}
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {active.map((r) => <RunCard key={r.id} run={r} />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-3">Recent runs</h2>
          {recent.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No runs yet. Dispatch one above or pick a demo preset.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {recent.map((r) => <RunCard key={r.id} run={r} />)}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function PresetButton({ topic, persona }: { topic: string; persona: "founder" | "student" | "investor" }) {
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
    <Button
      variant="outline"
      onClick={go}
      disabled={busy}
      className="h-auto py-3 px-4 text-left flex flex-col items-start gap-1 border-border hover:border-primary/40 bg-card/40"
    >
      <span className="font-mono text-[10px] uppercase tracking-wider text-primary">{persona}</span>
      <span className="text-xs text-foreground whitespace-normal">{topic}</span>
    </Button>
  );
}
