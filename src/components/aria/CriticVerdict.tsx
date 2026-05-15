import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import type { Verdict } from "@/lib/aria/types";

export function CriticVerdict({ verdict, retries }: { verdict?: Verdict; retries: number }) {
  if (!verdict) {
    return (
      <div className="glass-panel premium-card liquid-border rounded-2xl p-5">
        <div className="section-kicker mb-2 text-muted-foreground">Critic verdict</div>
        <div className="space-y-2">
          {[80, 58, 70].map((width, index) => (
            <motion.div
              key={width}
              animate={{ opacity: [0.35, 0.78, 0.35] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.12 }}
              className="h-2 rounded-full bg-white/10"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>
    );
  }
  const Icon = verdict.passed ? CheckCircle2 : AlertTriangle;
  const color = verdict.passed ? "text-success" : "text-warn";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel premium-card liquid-border rounded-2xl p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="section-kicker text-muted-foreground">Critic verdict</div>
        {retries > 0 && (
          <div className="flex items-center gap-1 rounded-full border border-warn/20 bg-warn/10 px-2 py-1 font-mono text-[10px] text-warn">
            <RotateCcw className="h-3 w-3" /> {retries} retry
          </div>
        )}
      </div>
      <div className={`mb-3 flex items-center gap-2 ${color}`}>
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <span className="font-mono text-sm font-bold uppercase">
          {verdict.passed ? "PASS" : "FAIL"}
        </span>
      </div>
      <ul className="space-y-1.5">
        {verdict.reasons.map((r, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex gap-2 text-xs text-muted-foreground"
          >
            <span className="text-primary/60">▸</span> {r}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
