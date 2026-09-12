import { Link, useRouterState } from "@tanstack/react-router";
import { Clapperboard, Hexagon, MoreHorizontal, Radar, Sprout } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLab } from "@/lib/store";

const TABS = [
  { to: "/radar", label: "Radar", icon: Radar },
  { to: "/swarm", label: "Swarm", icon: Hexagon },
  { to: "/", label: "Studio", icon: Clapperboard },
  { to: "/evolve", label: "Evolve", icon: Sprout },
  { to: "/more", label: "More", icon: MoreHorizontal },
] as const;

function tabActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/" || pathname.startsWith("/p/");
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({
  children,
  nav = true,
}: {
  children: React.ReactNode;
  nav?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tick = useLab((s) => s.tick);

  useEffect(() => {
    const id = window.setInterval(tick, 2200);
    return () => window.clearInterval(id);
  }, [tick]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div
        className={cn(
          "mx-auto min-h-dvh max-w-lg md:grid md:max-w-6xl",
          nav && "md:grid-cols-[5.5rem_minmax(0,1fr)]",
        )}
      >
        {nav ? (
          <nav
            aria-label="Primary"
            className="sticky top-0 hidden h-dvh flex-col items-center gap-1 border-r border-border py-6 md:flex"
          >
            <span className="mb-6 font-display text-lg tracking-tight text-fg">P</span>
            {TABS.map((tab) => {
              const on = tabActive(pathname, tab.to);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "flex w-[4.5rem] flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[0.65rem] font-medium tracking-[0.14em] uppercase",
                    "transition-colors duration-150",
                    on ? "bg-chip-active text-accent" : "text-subtle hover:text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={on ? 1.8 : 1.5} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className={cn(nav && "pb-24 md:pb-0")}>{children}</div>
      </div>

      {nav ? (
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur-md md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-2 pb-2">
            {TABS.map((tab) => {
              const on = tabActive(pathname, tab.to);
              const Icon = tab.icon;
              return (
                <li key={tab.to}>
                  <Link
                    to={tab.to}
                    className={cn(
                      "flex min-h-11 flex-col items-center justify-center gap-1 text-[0.62rem] font-medium tracking-[0.16em] uppercase",
                      "transition-colors duration-150",
                      on ? "text-accent" : "text-subtle",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={on ? 1.85 : 1.5} />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
