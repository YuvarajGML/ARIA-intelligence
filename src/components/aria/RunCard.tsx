import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { PERSONAS } from "@/lib/aria/personas";
import type { Run } from "@/lib/aria/types";

export function RunCard({ run }: { run: Run }) {
  const Icon =
    run.status === "completed"
      ? CheckCircle2
      : run.status === "failed"
        ? AlertTriangle
        : run.status === "running"
          ? Loader2
          : Activity;
  const color =
    run.status === "completed"
      ? "text-success"
      : run.status === "failed"
        ? "text-destructive"
        : run.status === "running"
          ? "text-primary"
          : "text-muted-foreground";
  const confidenceColor =
    run.confidence >= 0.7
      ? "text-success"
      : run.confidence >= 0.5
        ? "text-warn"
        : "text-muted-foreground";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <Link
        to="/runs/$id"
        params={{ id: run.id }}
        className="glass-panel premium-card liquid-border group block rounded-2xl p-4"
      >
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Icon
                className={`h-3.5 w-3.5 ${color} ${run.status === "running" ? "animate-spin" : ""}`}
              />
              <span className={`font-mono text-[10px] uppercase tracking-wider ${color}`}>
                {run.status}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/70">
                · {PERSONAS[run.persona].label}
              </span>
            </div>
            <div className="truncate text-sm font-medium transition-colors group-hover:text-primary">
              {run.topic}
            </div>
            {run.reportPreview && (
              <div className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {run.reportPreview}
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className={`font-mono text-lg font-semibold ${confidenceColor}`}>
              {Math.round(run.confidence * 100)}%
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {run.evidenceCount} src · {run.retries > 0 && `${run.retries} retry · `}
              {new Date(run.createdAt).toISOString().slice(11, 19)}
            </div>
          </div>
        </div>
        <div className="data-sheen relative mt-4 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(run.confidence * 100)}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-success"
          />
        </div>
      </Link>
    </motion.div>
  );
}
