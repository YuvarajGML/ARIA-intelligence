import type { Verdict } from "@/lib/aria/types";
import { CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";

export function CriticVerdict({ verdict, retries }: { verdict?: Verdict; retries: number }) {
  if (!verdict) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Critic verdict</div>
        <div className="text-sm text-muted-foreground">awaiting verdict…</div>
      </div>
    );
  }
  const Icon = verdict.passed ? CheckCircle2 : AlertTriangle;
  const color = verdict.passed ? "text-success" : "text-warn";
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Critic verdict</div>
        {retries > 0 && (
          <div className="font-mono text-[10px] flex items-center gap-1 text-warn">
            <RotateCcw className="h-3 w-3" /> {retries} retry
          </div>
        )}
      </div>
      <div className={`flex items-center gap-2 ${color} mb-3`}>
        <Icon className="h-5 w-5" />
        <span className="font-mono text-sm font-bold uppercase">{verdict.passed ? "PASS" : "FAIL"}</span>
      </div>
      <ul className="space-y-1">
        {verdict.reasons.map((r, i) => (
          <li key={i} className="text-xs text-muted-foreground flex gap-2">
            <span className="text-primary/60">▸</span> {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
