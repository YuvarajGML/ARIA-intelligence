import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/aria/AppShell";
import type { Delivery } from "@/lib/aria/types";
import { Mail, MessageSquare, FileText, Github, ExternalLink } from "lucide-react";

const ICON = {
  email: Mail,
  gmail: Mail,
  discord: MessageSquare,
  notion: FileText,
  github: Github,
} as const;

export const Route = createFileRoute("/deliveries")({
  component: Page,
});

function Page() {
  const [items, setItems] = useState<Delivery[]>([]);
  useEffect(() => {
    const fetchAll = () =>
      fetch("/api/aria/deliveries")
        .then((r) => r.json())
        .then((j) => setItems(j.deliveries));
    fetchAll();
    const t = setInterval(fetchAll, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery log</h1>
          <p className="text-sm text-muted-foreground mt-1">All channel deliveries across runs.</p>
        </div>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No deliveries yet.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card/60 divide-y divide-border">
            {items.map((d) => {
              const Icon = ICON[d.channel];
              const ok = d.status === "sent";
              return (
                <div key={d.id} className="flex items-center gap-4 px-4 py-3">
                  <Icon className={`h-4 w-4 ${ok ? "text-success" : "text-destructive"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm capitalize">
                      {d.channel} <span className="text-muted-foreground">·</span>{" "}
                      <Link
                        to="/runs/$id"
                        params={{ id: d.runId }}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {d.runId}
                      </Link>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground truncate">
                      {d.target ?? "—"} {d.detail && `· ${d.detail}`}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {new Date(d.at).toISOString().slice(11, 19)}
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
