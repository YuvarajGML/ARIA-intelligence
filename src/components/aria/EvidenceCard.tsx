import type { Evidence } from "@/lib/aria/types";
import { ExternalLink } from "lucide-react";

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const score = Math.round(evidence.score * 100);
  const tier = score >= 80 ? "text-success" : score >= 60 ? "text-warn" : "text-muted-foreground";
  return (
    <a
      href={evidence.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-md border border-border bg-card/40 p-3 hover:bg-card hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>{evidence.source}</span>
            <span className={`font-bold ${tier}`}>{score}</span>
          </div>
          <div className="text-sm font-medium mt-0.5 group-hover:text-primary transition-colors line-clamp-2">
            {evidence.title}
          </div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{evidence.snippet}</div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
      </div>
    </a>
  );
}
