import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Activity, Brain, Inbox, Settings as SettingsIcon, Users } from "lucide-react";
import { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Live Runs", icon: Activity },
  { to: "/personas", label: "Personas", icon: Users },
  { to: "/deliveries", label: "Deliveries", icon: Inbox },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="dark min-h-screen text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-card/40 backdrop-blur-sm min-h-screen sticky top-0">
          <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
            <div className="relative h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center glow-primary">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-mono text-[15px] font-bold tracking-tight">ARIA</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Autonomous Intelligence</div>
            </div>
          </div>
          <nav className="px-3 py-4 flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto px-5 py-4 border-t border-border">
            <div className="font-mono text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                AGENTS ONLINE
              </div>
              <div className="mt-1">v0.1.0 · mock-engine</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-md">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="font-mono text-xs text-muted-foreground tracking-wide">
                <span className="text-primary">●</span> CONTROL ROOM <span className="text-muted-foreground/60">/</span>{" "}
                {loc.pathname === "/" ? "live runs" : loc.pathname.slice(1)}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {new Date().toISOString().slice(0, 19).replace("T", " ")}
              </div>
            </div>
          </header>
          <div className="px-6 py-6 max-w-[1400px] mx-auto">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}
