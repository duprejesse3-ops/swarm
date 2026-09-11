import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Pause, Play, FastForward } from "lucide-react";
import { packetMarkdown } from "@/lib/genome";
import { hoursLabel, totals } from "@/lib/stats";
import { useSwarmStore } from "@/lib/store";
import { formatCompact, formatMoney } from "@/lib/utils";
import { OrganismCard, channelLabel } from "@/components/organism-card";
import { PlacementPreview } from "@/components/placement-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/swarm")({ component: SwarmBoard });

function SwarmBoard() {
  const swarms = useSwarmStore((s) => s.swarms);
  const organisms = useSwarmStore((s) => s.organisms);
  const selectedId = useSwarmStore((s) => s.selectedId);
  const select = useSwarmStore((s) => s.select);
  const toggleRun = useSwarmStore((s) => s.toggleRun);
  const tick = useSwarmStore((s) => s.tick);
  const setBudget = useSwarmStore((s) => s.setBudget);
  const [swarmId, setSwarmId] = useState(swarms[0]?.id ?? "");
  const swarm = swarms.find((s) => s.id === swarmId) ?? swarms[0];
  const list = useMemo(
    () =>
      organisms
        .filter((o) => !swarm || o.swarmId === swarm.id)
        .sort((a, b) => {
          if (a.status === "killed" && b.status !== "killed") return 1;
          if (b.status === "killed" && a.status !== "killed") return -1;
          return b.fitness - a.fitness;
        }),
    [organisms, swarm],
  );
  const selected = organisms.find((o) => o.id === selectedId) ?? list[0];
  const stats = totals(list);

  async function copyPacket() {
    const md = packetMarkdown(list);
    await navigator.clipboard.writeText(md);
    toast.success("Deploy packet copied");
  }

  if (!swarm) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">No swarms yet. Hijack an intent from Radar.</p>
        <Button asChild className="mt-4">
          <Link to="/">Open radar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-subtle">Organism board</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight">{swarm.name}</h1>
          <p className="mt-1 text-sm text-muted">
            Generation {swarm.generation} · {hoursLabel(swarm.simulatedHours)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toggleRun(swarm.id)}>
            {swarm.running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {swarm.running ? "Pause" : "Run"}
          </Button>
          <Button variant="secondary" onClick={() => tick(24)}>
            <FastForward className="size-4" /> 24h
          </Button>
          <Button variant="outline" onClick={() => void copyPacket()}>
            <Copy className="size-4" /> Packet
          </Button>
        </div>
      </div>

      {swarms.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {swarms.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSwarmId(s.id)}
              className="shrink-0 rounded-full px-3 py-2 text-xs shadow-[var(--shadow-border)]"
            >
              <span className={s.id === swarm.id ? "text-fg" : "text-muted"}>{s.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Mini label="Impressions" value={formatCompact(stats.impressions)} />
        <Mini label="Hijacked clicks" value={formatCompact(stats.clicks)} />
        <Mini label="Conversions" value={String(stats.conversions)} />
        <Mini label="Spend" value={formatMoney(stats.spend)} />
      </div>

      <label className="flex flex-col gap-2 text-xs uppercase tracking-widest text-subtle">
        Daily mycelium budget · {formatMoney(swarm.dailyBudget)}
        <input
          type="range"
          min={12}
          max={240}
          step={4}
          value={swarm.dailyBudget}
          onChange={(e) => setBudget(swarm.id, Number(e.target.value))}
          className="h-11 accent-accent"
        />
      </label>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="flex flex-col gap-3">
          {list.map((o) => (
            <OrganismCard
              key={o.id}
              organism={o}
              selected={selected?.id === o.id}
              onSelect={() => select(o.id)}
            />
          ))}
        </div>
        {selected ? (
          <div className="lg:sticky lg:top-20 h-fit">
            <div className="mb-3 flex items-center justify-between">
              <Badge>{channelLabel(selected.channel)}</Badge>
              <Button asChild variant="ghost" size="sm">
                <Link to="/studio">Open in studio</Link>
              </Button>
            </div>
            <PlacementPreview organism={selected} />
            <Card className="mt-4">
              <CardContent className="pt-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-subtle">Genome</p>
                <p className="mt-2 text-sm">{selected.targetIntent}</p>
                <p className="mt-2 text-xs text-muted">{selected.proofHook}</p>
                <a
                  href={selected.landingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block truncate font-mono text-[11px] text-accent hover:underline"
                >
                  {selected.landingUrl}
                </a>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-[11px] uppercase tracking-widest text-subtle">{label}</p>
      <p className="mt-1 font-mono text-xl tabular-nums">{value}</p>
    </div>
  );
}
