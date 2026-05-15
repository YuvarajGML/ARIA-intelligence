import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Activity, Brain, Inbox, Settings as SettingsIcon, Users } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

function LiveClock() {
  const [t, setT] = useState<string>("");
  useEffect(() => {
    const tick = () => setT(new Date().toISOString().slice(0, 19).replace("T", " "));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{t || "\u00a0"}</span>;
}

const NAV = [
  { to: "/", label: "Live Runs", icon: Activity },
  { to: "/personas", label: "Personas", icon: Users },
  { to: "/deliveries", label: "Deliveries", icon: Inbox },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const loc = useLocation();
  const rawX = useMotionValue(50);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 80, damping: 24, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 80, damping: 24, mass: 0.4 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      rawX.set(event.clientX);
      rawY.set(event.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [rawX, rawY]);

  return (
    <div className="dark min-h-screen text-foreground aurora-field spotlight relative overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        style={{ "--spot-x": x, "--spot-y": y } as React.CSSProperties}
      >
        <div className="absolute inset-0 ambient-grid" />
        <div className="absolute -top-40 left-[10%] h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-aurora" />
        <div className="absolute top-10 right-[5%] h-[28rem] w-[28rem] rounded-full bg-success/10 blur-3xl animate-aurora [animation-delay:-5s]" />
        <div className="absolute bottom-[-12rem] left-[35%] h-[32rem] w-[32rem] rounded-full bg-warn/10 blur-3xl animate-aurora [animation-delay:-9s]" />
        <div className="absolute inset-0 neural-lines opacity-35" />
      </motion.div>

      <div className="relative z-10 flex">
        <motion.aside
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/10 bg-background/35 backdrop-blur-2xl min-h-screen sticky top-0"
        >
          <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
            <div className="relative h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center glow-primary animated-border">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-mono text-[15px] font-bold tracking-tight">ARIA</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Autonomous Intelligence
              </div>
            </div>
          </div>
          <nav className="px-3 py-4 flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`magnetic-button relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_oklch(0.78_0.16_200_/_0.22)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-primary/10"
                      transition={{ type: "spring", stiffness: 360, damping: 32 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto px-5 py-4 border-t border-white/10">
            <div className="font-mono text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shadow-[0_0_18px_oklch(0.78_0.16_155)]" />
                AGENTS ONLINE
              </div>
              <div className="mt-1">v0.1.0 · mock-engine</div>
            </div>
          </div>
        </motion.aside>

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-background/45 backdrop-blur-2xl">
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="font-mono text-xs text-muted-foreground tracking-wide">
                <span className="text-primary">●</span> CONTROL ROOM{" "}
                <span className="text-muted-foreground/60">/</span>{" "}
                {loc.pathname === "/" ? "live runs" : loc.pathname.slice(1)}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                <LiveClock />
              </div>
            </div>
          </header>
          <AnimatePresence mode="wait">
            <motion.div
              key={loc.pathname}
              initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="px-4 sm:px-6 py-6 max-w-[1440px] mx-auto"
            >
              {children ?? <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
