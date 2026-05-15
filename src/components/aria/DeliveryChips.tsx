import type { Delivery } from "@/lib/aria/types";
import { Mail, MessageSquare, FileText, Github, ExternalLink, AlertCircle } from "lucide-react";

const ICON = { email: Mail, discord: MessageSquare, notion: FileText, github: Github } as const;

export function DeliveryChips({ deliveries }: { deliveries: Delivery[] }) {
  if (deliveries.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Deliveries</div>
      <div className="space-y-2">
        {deliveries.map((d) => {
          const Icon = ICON[d.channel];
          const ok = d.status === "sent";
          return (
            <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-md border border-border bg-background/40">
              <Icon className={`h-4 w-4 ${ok ? "text-success" : "text-destructive"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm capitalize">{d.channel}</div>
                <div className="font-mono text-[10px] text-muted-foreground truncate">
                  {d.target ?? "—"} {d.detail && `· ${d.detail}`}
                </div>
              </div>
              {ok && d.target?.startsWith("http") && (
                <a href={d.target} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {!ok && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
