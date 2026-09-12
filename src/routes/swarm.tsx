import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/metrics";
import { CAMPAIGNS, FORMAT_LABEL, formatMoney } from "@/lib/catalog";
import { useLab } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/swarm")({ component: SwarmPage });

function SwarmPage() {
  const placements = useLab((s) => s.placements);
  const swarm = useLab((s) => s.swarm);
  const toggle = useLab((s) => s.toggleInSwarm);

  return (
    <AppShell>
      <main className="px-5 pt-8 md:pt-10">
        <p className="text-[0.7rem] font-medium tracking-[0.22em] text-subtle uppercase">
          Swarm
        </p>
        <h1 className="mt-3 font-display text-[2.15rem] leading-[1.12] tracking-tight">
          Campaigns as a swarm of placements
        </h1>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted">
          Each campaign is a cluster. Pull a unit out of the swarm and it stops
          riding the budget. Lab units still simulate; live units spend.
        </p>

        <ul className="mt-8 space-y-8 pb-8">
          {CAMPAIGNS.map((c) => {
            const members = placements.filter((p) => p.campaignId === c.id);
            const inSwarm = swarm[c.id] ?? [];
            const liveN = members.filter((p) => p.status === "live" && inSwarm.includes(p.id)).length;
            return (
              <li key={c.id}>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl">{c.name}</h2>
                    <p className="mt-1 text-sm text-muted">{c.brief}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm tabular-nums text-subtle">
                    {formatMoney(c.budget)}
                    <span className="block text-[0.65rem] tracking-[0.12em] uppercase">
                      {liveN} live
                    </span>
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {members.map((p) => {
                    const on = inSwarm.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        title={p.product}
                        onClick={() => toggle(c.id, p.id)}
                        className={cn(
                          "flex aspect-square flex-col items-center justify-center rounded-2xl px-1 text-center",
                          "transition-colors duration-150",
                          on ? "bg-chip-active text-fg" : "bg-elevated text-subtle",
                        )}
                      >
                        <span className="font-display text-lg leading-none">
                          {p.product.split(" ")[0]!.slice(0, 2)}
                        </span>
                        <span className="mt-1 text-[0.6rem] tracking-[0.08em] uppercase">
                          {p.format}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <ul className="mt-3 divide-y divide-border">
                  {members.map((p) => {
                    const on = inSwarm.includes(p.id);
                    return (
                      <li key={p.id} className="flex items-center gap-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggle(c.id, p.id)}
                          className={cn(
                            "size-4 shrink-0 rounded-full border",
                            on ? "border-accent bg-accent" : "border-border-strong",
                          )}
                          aria-label={on ? "Remove from swarm" : "Add to swarm"}
                        />
                        <Link
                          to="/p/$id"
                          params={{ id: p.id }}
                          className="min-w-0 flex-1"
                        >
                          <p className="truncate text-sm text-fg">
                            {p.product}
                            <span className="text-subtle"> · {FORMAT_LABEL[p.format]}</span>
                          </p>
                        </Link>
                        <StatusPill placement={p} />
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </main>
    </AppShell>
  );
}
