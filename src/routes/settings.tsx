import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/aria/AppShell";
import { CheckCircle2, AlertCircle } from "lucide-react";

const SECRETS = [
  { name: "SERPER_API_KEY", desc: "Web search via Serper.dev" },
  { name: "RESEND_API_KEY", desc: "Email delivery" },
  { name: "DISCORD_WEBHOOK_URL", desc: "Discord channel webhook" },
  { name: "NOTION_API_KEY", desc: "Notion workspace access" },
  { name: "GITHUB_TOKEN", desc: "GitHub gist creation" },
  { name: "LOVABLE_API_KEY", desc: "Lovable AI Gateway (auto-provisioned)" },
];

export const Route = createFileRoute("/settings")({
  component: Page,
});

function Page() {
  const [status, setStatus] = useState<Record<string, boolean>>({});
  useEffect(() => {
    fetch("/api/aria/settings").then((r) => r.json()).then((j) => setStatus(j.status ?? {})).catch(() => {});
  }, []);
  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Backend wiring and connector status.</p>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-5">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-3">Connector secrets</h2>
          <div className="space-y-2">
            {SECRETS.map((s) => {
              const ok = status[s.name];
              return (
                <div key={s.name} className="flex items-center gap-3 p-3 rounded border border-border bg-background/40">
                  {ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-warn" />}
                  <div className="flex-1">
                    <div className="font-mono text-xs">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                  <div className={`font-mono text-[10px] uppercase tracking-wider ${ok ? "text-success" : "text-warn"}`}>
                    {ok ? "configured" : "missing"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-5">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">Backend</h2>
          <p className="text-sm text-muted-foreground">
            ARIA runs in <span className="text-primary font-mono">mock-engine</span> mode by default — a complete
            multi-agent pipeline running in TanStack server functions. Set{" "}
            <code className="font-mono text-xs bg-background px-1 py-0.5 rounded">ARIA_BACKEND_URL</code> to forward
            runs to a Python LangGraph backend instead.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
