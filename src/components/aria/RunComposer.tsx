import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileText, Github, Loader2, Mail, MessageSquare, Sparkles } from "lucide-react";
import { PERSONA_LIST } from "@/lib/aria/personas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { Channel, PersonaId } from "@/lib/aria/types";

const CHANNELS: { id: Channel; label: string; icon: typeof Mail }[] = [
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
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="glass-panel premium-card liquid-border relative rounded-[1.6rem] p-5 sm:p-6"
    >
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute bottom-0 left-8 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary glow-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-primary">
              New autonomous run
            </h2>
            <p className="text-xs text-muted-foreground">
              Compose, route, and launch the agent swarm.
            </p>
          </div>
        </div>
        <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:block">
          {channels.length} channel{channels.length === 1 ? "" : "s"}
        </div>
      </div>

      <Input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Topic - e.g. 'state of AI agents Q2 2026'"
        className="relative h-14 rounded-2xl border-white/10 bg-background/55 px-4 text-base shadow-inner outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
        onKeyDown={(e) => e.key === "Enter" && go()}
      />

      <div className="relative mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.8fr_1fr]">
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Persona
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PERSONA_LIST.filter((p) => p.id !== "custom").map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPersona(p.id)}
                className={`premium-card liquid-border rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                  persona === p.id
                    ? "border-primary/50 bg-primary/10 text-foreground shadow-[0_0_24px_oklch(0.78_0.16_200_/_0.12)]"
                    : "border-white/10 bg-white/[0.035] text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="font-medium">{p.label}</div>
                <div className="mt-0.5 truncate text-[10px] opacity-70">{p.tagline}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Depth · <span className="text-primary">{depth}</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <Slider
              value={[depth]}
              onValueChange={(v) => setDepth(v[0])}
              min={1}
              max={5}
              step={1}
              className="mt-1"
            />
            <div className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>quick</span>
              <span>deep</span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Deliver to
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
            {CHANNELS.map(({ id, label, icon: Icon }) => {
              const on = channels.includes(id);
              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    setChannels((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
                  }
                  className={`magnetic-button liquid-border flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition-colors ${
                    on
                      ? "border-primary/55 bg-primary/10 text-foreground"
                      : "border-white/10 bg-white/[0.035] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex justify-end">
        <Button
          onClick={go}
          disabled={busy || !topic.trim()}
          size="lg"
          className="magnetic-button glow-primary min-w-48 rounded-xl font-mono"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              dispatching
            </>
          ) : (
            "Dispatch agents ->"
          )}
        </Button>
      </div>
    </motion.div>
  );
}
