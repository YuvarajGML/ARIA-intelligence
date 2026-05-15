import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Evidence } from "@/lib/aria/types";

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const score = Math.round(evidence.score * 100);
  const tier = score >= 80 ? "text-success" : score >= 60 ? "text-warn" : "text-muted-foreground";
  return (
    <motion.a
      href={evidence.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 3 }}
      className="premium-card liquid-border group block rounded-xl border border-white/10 bg-white/[0.035] p-3 transition-colors hover:border-primary/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{evidence.source}</span>
            <span className={`font-bold ${tier}`}>{score}</span>
          </div>
          <div className="mt-0.5 line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
            {evidence.title}
          </div>
          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{evidence.snippet}</div>
        </div>
        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </div>
    </motion.a>
  );
}
