import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { AgentTimeline } from "@/components/aria/AgentTimeline";
import { AppShell } from "@/components/aria/AppShell";
import { ConfidenceMeter } from "@/components/aria/ConfidenceMeter";
import { CriticVerdict } from "@/components/aria/CriticVerdict";
import { DeliveryChips } from "@/components/aria/DeliveryChips";
import { EvidenceCard } from "@/components/aria/EvidenceCard";
import { LiveEventLog } from "@/components/aria/LiveEventLog";
import { ReportView } from "@/components/aria/ReportView";
import { PERSONAS } from "@/lib/aria/personas";
import { subscribeRunEvents } from "@/lib/aria/sse";
import type { AriaEvent, Delivery, Evidence, Run, Verdict } from "@/lib/aria/types";

export const Route = createFileRoute("/runs/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const [run, setRun] = useState<Run | null>(null);
  const [events, setEvents] = useState<AriaEvent[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [report, setReport] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | undefined>();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    setEvents([]);
    setEvidence([]);
    setReport("");
    setConfidence(0);
    setVerdict(undefined);
    setDeliveries([]);
    setRetries(0);

    fetch(`/api/aria/runs/${id}`)
      .then((r) => r.json())
      .then((j) => {
        setRun(j.run);
      });
    const unsub = subscribeRunEvents(id, (e) => {
      setEvents((prev) => [...prev, e]);
      if (e.type === "evidence.added") setEvidence((p) => [...p, e.evidence]);
      if (e.type === "confidence.updated") setConfidence(e.score);
      if (e.type === "critic.verdict") setVerdict(e.verdict);
      if (e.type === "retry.scheduled") setRetries(e.attempt);
      if (e.type === "report.chunk") setReport((p) => p + e.token);
      if (e.type === "delivery.sent") setDeliveries((p) => [...p, e.delivery]);
      if (e.type === "run.completed" || e.type === "run.failed") {
        fetch(`/api/aria/runs/${id}`)
          .then((r) => r.json())
          .then((j) => setRun(j.run));
      }
    });
    return unsub;
  }, [id]);

  const sortedEvidence = [...evidence].sort((a, b) => b.score - a.score);

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            to="/"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="h-3 w-3" /> back to control
          </Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h1 className="hero-title text-2xl font-semibold tracking-tight">
              {run?.topic ?? "loading..."}
            </h1>
            {run && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {PERSONAS[run.persona].label} · depth {run.depth} · {run.id}
              </span>
            )}
          </div>
        </motion.div>

        <AgentTimeline events={events} />

        <div className="grid gap-4 lg:grid-cols-3">
          <ConfidenceMeter score={confidence || (run?.confidence ?? 0)} />
          <CriticVerdict
            verdict={verdict ?? run?.verdict}
            retries={retries || (run?.retries ?? 0)}
          />
          <DeliveryChips deliveries={deliveries} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <LiveEventLog events={events} />
          <div className="glass-panel premium-card liquid-border rounded-2xl p-5">
            <div className="section-kicker mb-3 text-muted-foreground">
              Evidence · {sortedEvidence.length}
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {sortedEvidence.length === 0 && (
                <div className="text-sm text-muted-foreground">awaiting first sources...</div>
              )}
              {sortedEvidence.map((e) => (
                <EvidenceCard key={e.id} evidence={e} />
              ))}
            </div>
          </div>
        </div>

        <ReportView markdown={report} />
      </div>
    </AppShell>
  );
}
