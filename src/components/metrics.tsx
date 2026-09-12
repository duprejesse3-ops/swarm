import { formatCompact, formatPct, formatSec } from "@/lib/catalog";
import type { Placement } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MetricsStrip({ placement }: { placement: Placement }) {
  const live = placement.status === "live" && placement.live;
  const m = live ? placement.live! : placement.lab;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[0.65rem] font-medium tracking-[0.16em] text-subtle uppercase">
          {live ? "Live numbers" : "Lab numbers"}
        </p>
        {!live ? (
          <span className="rounded-full bg-chip px-2 py-0.5 text-[0.65rem] tracking-[0.12em] text-muted uppercase">
            Simulated
          </span>
        ) : (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] tracking-[0.12em] text-accent uppercase">
            Shipped
          </span>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <Stat label="Impr." value={formatCompact(m.impressions)} />
        <Stat label="CTR" value={formatPct(m.ctr)} />
        <Stat label="Dwell" value={formatSec(m.dwell)} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-elevated px-3 py-2.5">
      <dt className="text-[0.65rem] tracking-[0.14em] text-subtle uppercase">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums text-fg">{value}</dd>
    </div>
  );
}

export function StatusPill({ placement, className }: { placement: Placement; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase",
        placement.status === "live"
          ? "bg-accent/15 text-accent"
          : "bg-chip text-muted",
        className,
      )}
    >
      {placement.status}
    </span>
  );
}
