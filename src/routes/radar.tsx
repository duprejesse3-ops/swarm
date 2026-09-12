import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FORMAT_LABEL } from "@/lib/catalog";
import { useLab } from "@/lib/store";
import type { SignalKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/radar")({ component: RadarPage });

const KIND: Record<SignalKind, string> = {
  query: "Query",
  opening: "Opening",
  listing: "Listing",
  packet: "Packet",
};

function RadarPage() {
  const signals = useLab((s) => s.signals);
  const placements = useLab((s) => s.placements);
  const liveCount = placements.filter((p) => p.status === "live").length;
  const blips = placements.slice(0, 8);

  return (
    <AppShell>
      <main className="px-5 pt-8 md:pt-10">
        <p className="text-[0.7rem] font-medium tracking-[0.22em] text-subtle uppercase">
          Radar
        </p>
        <h1 className="mt-3 font-display text-[2.15rem] leading-[1.12] tracking-tight">
          Incoming intent
        </h1>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted">
          Queries, conversation openings, and directory looks that would fire a
          packet. Lab is listening. Live is only what you shipped.
        </p>

        <div className="relative mx-auto mt-8 aspect-square w-[min(100%,18rem)]">
          <div className="absolute inset-0 rounded-full border border-border" />
          <div className="absolute inset-[18%] rounded-full border border-border" />
          <div className="absolute inset-[36%] rounded-full border border-border" />
          <div className="radar-sweep absolute inset-0 rounded-full" />
          {blips.map((p, i) => {
            const angle = (i / blips.length) * Math.PI * 2 - Math.PI / 2;
            const r = 28 + (i % 3) * 18;
            const x = 50 + Math.cos(angle) * r;
            const y = 50 + Math.sin(angle) * r;
            return (
              <span
                key={p.id}
                className={cn(
                  "absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  p.status === "live" ? "bg-accent" : "bg-fg/70",
                )}
                style={{ left: `${x}%`, top: `${y}%` }}
                title={p.product}
              />
            );
          })}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-4xl tabular-nums">{liveCount}</p>
            <p className="text-[0.65rem] tracking-[0.16em] text-subtle uppercase">Live packets</p>
          </div>
        </div>

        <h2 className="mt-8 text-[0.7rem] font-medium tracking-[0.18em] text-subtle uppercase">
          Signal tape
        </h2>
        <ul className="mt-3 divide-y divide-border pb-8">
          {signals.map((s) => {
            const p = placements.find((x) => x.id === s.matchId);
            return (
              <li key={s.id}>
                <Link
                  to="/p/$id"
                  params={{ id: s.matchId }}
                  className="flex items-start justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-[0.65rem] tracking-[0.14em] text-accent uppercase">
                      {KIND[s.kind]}
                      {p ? ` · ${FORMAT_LABEL[p.format]}` : ""}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-fg">{s.text}</p>
                    <p className="mt-1 text-xs text-subtle">
                      {p?.product ?? "Unmatched"} · <TimeAgo at={s.at} />
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-lg tabular-nums text-muted">
                    {Math.round(s.score * 100)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </AppShell>
  );
}

function TimeAgo({ at }: { at: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  if (now === null || at === 0) return "just now";
  const s = Math.max(1, Math.round((now - at) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}
