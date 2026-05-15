import { motion } from "framer-motion";

export function ConfidenceMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score));
  const deg = pct * 360;
  const color =
    pct >= 0.7
      ? "oklch(0.78 0.16 155)"
      : pct >= 0.5
        ? "oklch(0.82 0.16 75)"
        : "oklch(0.66 0.22 25)";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel premium-card liquid-border rounded-2xl p-5"
    >
      <div className="section-kicker mb-3 text-muted-foreground">Confidence</div>
      <div className="flex items-center gap-5">
        <motion.div
          className="grid h-24 w-24 place-items-center rounded-full shadow-[0_0_44px_oklch(0.78_0.16_200_/_0.10)]"
          animate={{
            background: `conic-gradient(${color} ${deg}deg, oklch(0.30 0.02 260 / 0.45) ${deg}deg)`,
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-background/80 backdrop-blur">
            <div className="text-center">
              <motion.div
                key={Math.round(pct * 100)}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-mono text-2xl font-bold"
                style={{ color }}
              >
                {Math.round(pct * 100)}
              </motion.div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                / 100
              </div>
            </div>
          </div>
        </motion.div>
        <div className="flex-1">
          <div className="font-mono text-xs leading-5 text-muted-foreground">
            Validator score across kept evidence using recency, authority, and relevance.
          </div>
          <div className="data-sheen relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-success"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
