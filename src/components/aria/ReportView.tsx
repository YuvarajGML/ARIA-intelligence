import { motion } from "framer-motion";

export function ReportView({ markdown }: { markdown: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel premium-card liquid-border rounded-2xl p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="section-kicker text-muted-foreground">Report streaming</div>
        <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_oklch(0.78_0.16_200)]" />
      </div>
      {markdown ? (
        <div className="prose prose-invert prose-sm max-w-none">
          <pre className="m-0 whitespace-pre-wrap bg-transparent p-0 font-sans text-sm leading-7 text-foreground">
            {markdown}
            <span className="ml-0.5 inline-block h-4 w-2 align-middle bg-primary/70 animate-pulse" />
          </pre>
        </div>
      ) : (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <motion.div
              key={item}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: item * 0.12 }}
              className="h-3 rounded-full bg-white/10"
              style={{ width: `${92 - item * 14}%` }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
