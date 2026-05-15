import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PERSONA_LIST } from "@/lib/aria/personas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { Channel, PersonaId } from "@/lib/aria/types";
import { Mail, MessageSquare, FileText, Github, Sparkles, Loader2 } from "lucide-react";

const CHANNELS: { id: Channel; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email", icon: Mail },
  { id: "gmail", label: "Gmail", icon: Mail },
  { id: "discord", label: "Discord", icon: MessageSquare },
  { id: "notion", label: "Notion", icon: FileText },
  { id: "github", label: "GitHub", icon: Github },
];

export function RunComposer({ initialTopic = "" }: { initialTopic?: string }) {
  const nav = useNavigate();
  const [topic, setTopic] = useState(initialTopic);
  const [persona, setPersona] = useState<PersonaId>("founder");
  const [depth, setDepth] = useState(3);
  const [channels, setChannels] = useState<Channel[]>(["discord"]);
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!topic.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/aria/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, persona, depth, channels }),
      });
      const data = await res.json();
      nav({ to: "/runs/$id", params: { id: data.run.id } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-mono text-sm tracking-wide uppercase text-primary">
          New autonomous run
        </h2>
      </div>

      <Input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Topic — e.g. 'state of AI agents Q2 2026'"
        className="bg-background/60 border-border h-12 text-base"
        onKeyDown={(e) => e.key === "Enter" && go()}
      />

      <div className="grid md:grid-cols-3 gap-5 mt-5">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Persona
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PERSONA_LIST.filter((p) => p.id !== "custom").map((p) => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`text-left rounded-md px-3 py-2 text-xs border transition-colors ${
                  persona === p.id
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <div className="font-medium">{p.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5 truncate">{p.tagline}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Depth · <span className="font-mono text-primary">{depth}</span>
          </div>
          <Slider
            value={[depth]}
            onValueChange={(v) => setDepth(v[0])}
            min={1}
            max={5}
            step={1}
            className="mt-3"
          />
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-2">
            <span>quick</span>
            <span>deep</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Deliver to
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CHANNELS.map(({ id, label, icon: Icon }) => {
              const on = channels.includes(id);
              return (
                <button
                  key={id}
                  onClick={() =>
                    setChannels((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
                  }
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs border transition-colors ${
                    on
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <Button onClick={go} disabled={busy || !topic.trim()} size="lg" className="font-mono">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              dispatching
            </>
          ) : (
            "Dispatch agents →"
          )}
        </Button>
      </div>
    </div>
  );
}
