import { Link } from "@tanstack/react-router";
import type { Run } from "@/lib/aria/types";
import { CheckCircle2, Loader2, AlertTriangle, Activity } from "lucide-react";
import { PERSONAS } from "@/lib/aria/personas";

export function RunCard({ run }: { run: Run }) {
  const Icon =
    run.status === "completed" ? CheckCircle2 :
    run.status === "failed" ? AlertTriangle :
    run.status === "running" ? Loader2 : Activity;
  const color =
    run.status === "completed" ? "text-success" :
    run.status === "failed" ? "text-destructive" :
    run.status === "running" ? "text-primary" : "text-muted-foreground";
  return (
    <Link
      to="/runs/$id"
      params={{ id: run.id }}
      className="block rounded-lg border border-border bg-card/60 hover:bg-card transition-colors p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-3.5 w-3.5 ${color} ${run.status === "running" ? "animate-spin" : ""}`} />
            <span className={`font-mono text-[10px] uppercase tracking-wider ${color}`}>{run.status}</span>
            <span className="font-mono text-[10px] text-muted-foreground/70">· {PERSONAS[run.persona].label}</span>
          </div>
          <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">{run.topic}</div>
          {run.reportPreview && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{run.reportPreview}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-xs">
            <span className={run.confidence >= 0.7 ? "text-success" : run.confidence >= 0.5 ? "text-warn" : "text-muted-foreground"}>
              {Math.round(run.confidence * 100)}%
            </span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {run.evidenceCount} src · {run.retries > 0 && `${run.retries} retry · `}
            {new Date(run.createdAt).toISOString().slice(11, 19)}
          </div>
        </div>
      </div>
    </Link>
  );
}
