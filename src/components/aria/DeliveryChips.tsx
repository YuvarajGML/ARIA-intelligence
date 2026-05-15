import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ExternalLink, FileText, Github, Mail, MessageSquare } from "lucide-react";
import type { Delivery } from "@/lib/aria/types";

const ICON = {
  email: Mail,
  gmail: Mail,
  discord: MessageSquare,
  notion: FileText,
  github: Github,
} as const;

export function DeliveryChips({ deliveries }: { deliveries: Delivery[] }) {
  if (deliveries.length === 0) return null;
  return (
    <div className="glass-panel premium-card rounded-2xl p-5">
      <div className="section-kicker mb-3 text-muted-foreground">Deliveries</div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {deliveries.map((d) => {
            const Icon = ICON[d.channel];
            const ok = d.status === "sent";
            return (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="premium-card flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2"
              >
                <Icon className={`h-4 w-4 ${ok ? "text-success" : "text-destructive"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm capitalize">{d.channel}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">
                    {d.target ?? "-"} {d.detail && `· ${d.detail}`}
                  </div>
                </div>
                {ok && d.target?.startsWith("http") && (
                  <a
                    href={d.target}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {!ok && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
