export function ConfidenceMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score));
  const deg = pct * 360;
  const color = pct >= 0.7 ? "oklch(0.78 0.16 155)" : pct >= 0.5 ? "oklch(0.82 0.16 75)" : "oklch(0.66 0.22 25)";
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Confidence</div>
      <div className="flex items-center gap-5">
        <div
          className="h-24 w-24 rounded-full grid place-items-center"
          style={{
            background: `conic-gradient(${color} ${deg}deg, oklch(0.30 0.02 260 / 0.5) ${deg}deg)`,
          }}
        >
          <div className="h-[78px] w-[78px] rounded-full bg-card grid place-items-center">
            <div className="text-center">
              <div className="font-mono text-2xl font-bold" style={{ color }}>
                {Math.round(pct * 100)}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">/ 100</div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="font-mono text-xs text-muted-foreground">
            Validator score across all kept evidence (recency × authority × relevance).
          </div>
        </div>
      </div>
    </div>
  );
}
