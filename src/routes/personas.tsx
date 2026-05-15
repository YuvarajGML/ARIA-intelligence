import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/aria/AppShell";
import { PERSONA_LIST } from "@/lib/aria/personas";

export const Route = createFileRoute("/personas")({
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personas shape what the Synthesizer writes — tone, sections, and how evidence is framed.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {PERSONA_LIST.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card/60 p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold text-lg">{p.label}</h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.id}</span>
              </div>
              <p className="text-sm text-primary mt-1">{p.tagline}</p>
              <div className="mt-4">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">System prompt</div>
                <p className="text-xs text-foreground/80 leading-relaxed">{p.systemPrompt}</p>
              </div>
              <div className="mt-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sections</div>
                <div className="flex flex-wrap gap-1.5">
                  {p.sections.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded text-[11px] bg-accent/40 border border-border">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
