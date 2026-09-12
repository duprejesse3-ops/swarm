import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { FORMAT_LABEL } from "@/lib/catalog";
import { useLab } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/evolve")({ component: EvolvePage });

function EvolvePage() {
  const placements = useLab((s) => s.placements);
  const variants = useLab((s) => s.variants);
  const active = useLab((s) => s.activeVariant);
  const promote = useLab((s) => s.promoteVariant);
  const withVars = useMemo(
    () => placements.filter((p) => variants.some((v) => v.placementId === p.id)),
    [placements, variants],
  );
  const [id, setId] = useState(withVars[0]?.id ?? placements[0]!.id);
  const p = placements.find((x) => x.id === id) ?? placements[0]!;
  const mine = variants.filter((v) => v.placementId === p.id);
  const current = active[p.id];

  return (
    <AppShell>
      <main className="px-5 pt-8 md:pt-10">
        <p className="text-[0.7rem] font-medium tracking-[0.22em] text-subtle uppercase">
          Evolve
        </p>
        <h1 className="mt-3 font-display text-[2.15rem] leading-[1.12] tracking-tight">
          Mutate the line. Keep the packet.
        </h1>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted">
          Lab CTR is simulated until the unit is live. Promote a variant and
          Studio will render it as the channel will.
        </p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {withVars.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setId(x.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-sm transition-colors",
                x.id === p.id ? "bg-chip-active text-fg" : "bg-chip text-muted",
              )}
            >
              {x.product}
              <span className="text-subtle"> · {FORMAT_LABEL[x.format].split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <ul className="mt-6 space-y-4 pb-8">
          {mine.map((v) => {
            const on = current === v.id;
            return (
              <li
                key={v.id}
                className={cn(
                  "rounded-2xl p-4 shadow-[var(--shadow-border)]",
                  on ? "bg-chip-active" : "bg-elevated",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-xl leading-snug text-fg">{v.headline}</p>
                  <p className="shrink-0 font-display text-2xl tabular-nums text-accent">
                    {v.labCtr.toFixed(1)}
                    <span className="ml-0.5 text-xs tracking-[0.12em] text-subtle uppercase">
                      ctr
                    </span>
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{v.body}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-fg/80">{v.cta}</p>
                  {on ? (
                    <span className="text-xs tracking-[0.14em] text-accent uppercase">
                      On studio
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      className="min-h-9 px-3 text-xs"
                      onClick={() => promote(p.id, v.id)}
                    >
                      Promote
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </AppShell>
  );
}
