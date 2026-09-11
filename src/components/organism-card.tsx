import { CHANNELS } from "@/lib/genome";
import { productBySku } from "@/lib/catalog";
import type { Organism } from "@/lib/types";
import { cn, formatCompact, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function channelLabel(channel: Organism["channel"]) {
  return CHANNELS.find((c) => c.id === channel)?.label ?? channel;
}

export function OrganismCard({
  organism,
  selected,
  onSelect,
}: {
  organism: Organism;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const product = productBySku(organism.sku);
  const dead = organism.status === "killed";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow,background-color] duration-150",
        selected ? "bg-elevated shadow-[var(--shadow-border-hover)]" : "bg-surface hover:bg-elevated",
        dead && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={organism.status === "champion" ? "accent" : dead ? "danger" : "default"}>
              {organism.status}
            </Badge>
            <span className="font-mono text-[10px] uppercase tracking-widest text-subtle">
              {channelLabel(organism.channel)} · gen {organism.generation}
            </span>
          </div>
          <h3 className="mt-2 text-sm font-medium leading-snug">{organism.headline}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{organism.body}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-lg tabular-nums text-accent">
            {organism.fitness.toFixed(0)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-subtle">fitness</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 font-mono text-[11px] tabular-nums text-muted">
        <span>{formatCompact(organism.impressions)} imp</span>
        <span>{formatCompact(organism.clicks)} clk</span>
        <span>{organism.conversions} conv</span>
        <span>{formatMoney(organism.spend)}</span>
      </div>
      <p className="mt-2 truncate font-mono text-[10px] text-subtle">
        {product?.name} · {organism.sku}
      </p>
    </button>
  );
}
