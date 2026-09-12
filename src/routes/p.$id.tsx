import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChannelMock, Monitor } from "@/components/channel-mocks";
import { MetricsStrip, StatusPill } from "@/components/metrics";
import { Button } from "@/components/ui/button";
import { DEST_LABEL, FORMAT_DEST, FORMAT_LABEL, campaignOf } from "@/lib/catalog";
import { useLab } from "@/lib/store";
import type { Destination } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/p/$id")({ component: PlacementPage });

function PlacementPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const placement = useLab((s) => s.placements.find((p) => p.id === id));
  const goLive = useLab((s) => s.goLive);
  const pullBack = useLab((s) => s.pullBack);
  const [shipping, setShipping] = useState(false);
  const [hop, setHop] = useState(0);

  function startShip() {
    if (!placement || shipping) return;
    setShipping(true);
    setHop(0);
    window.setTimeout(() => setHop(1), 420);
    window.setTimeout(() => setHop(2), 900);
    window.setTimeout(() => {
      goLive(placement.id, FORMAT_DEST[placement.format]);
      setShipping(false);
    }, 1480);
  }

  if (!placement) {
    return (
      <AppShell>
        <main className="px-5 pt-16">
          <p className="text-muted">That packet is not in the lab.</p>
          <Link to="/" className="mt-4 inline-block text-accent">
            Back to Studio
          </Link>
        </main>
      </AppShell>
    );
  }

  const dest: Destination = FORMAT_DEST[placement.format];
  const campaign = campaignOf(placement.campaignId);
  const hops = ["Studio", "Proof", DEST_LABEL[dest]];

  return (
    <AppShell>
      <main className="mx-auto max-w-lg px-5 pt-6 pb-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex size-11 items-center justify-center rounded-full bg-chip text-fg"
            aria-label="Back to studio"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[0.65rem] tracking-[0.18em] text-subtle uppercase">
              {FORMAT_LABEL[placement.format]}
            </p>
            <h1 className="truncate font-display text-2xl leading-tight">
              {placement.product}
            </h1>
          </div>
          <StatusPill placement={placement} className="ml-auto shrink-0" />
        </div>

        <Monitor
          className="mt-5"
          label={
            placement.format === "proof"
              ? "Proof monitor"
              : placement.format === "search"
                ? "Search surface"
                : placement.format === "conversation"
                  ? "Conversation"
                  : "Directory"
          }
        >
          <ChannelMock placement={placement} interactive />
        </Monitor>

        <p className="mt-3 text-xs text-subtle">
          {campaign?.name} · as the channel will
        </p>

        <div className="mt-6">
          <MetricsStrip placement={placement} />
        </div>

        <section className="mt-6 rounded-2xl bg-elevated p-4">
          <p className="font-display text-xl leading-snug">{placement.headline}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{placement.body}</p>
          <p className="mt-3 text-sm text-accent">{placement.cta}</p>
        </section>

        {shipping ? (
          <div className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="text-[0.65rem] tracking-[0.16em] text-subtle uppercase">
              Shipping packet
            </p>
            <ol className="mt-3 flex items-center justify-between gap-2">
              {hops.map((h, i) => (
                <li
                  key={h}
                  className={cn(
                    "flex-1 text-center text-sm",
                    i <= hop ? "text-fg" : "text-subtle",
                  )}
                >
                  <span
                    className={cn(
                      "mx-auto mb-2 block size-2 rounded-full",
                      i <= hop ? "bg-accent" : "bg-chip-active",
                    )}
                  />
                  {h}
                </li>
              ))}
            </ol>
          </div>
        ) : placement.status === "lab" ? (
          <Button
            className="mt-6 w-full"
            onClick={startShip}
          >
            Go live · ship to {DEST_LABEL[dest]}
          </Button>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-muted">
              Packet is live on {DEST_LABEL[placement.destination ?? dest]}. Lab
              numbers have been replaced.
            </p>
            <Button variant="ghost" className="w-full" onClick={() => pullBack(placement.id)}>
              Pull back to lab
            </Button>
          </div>
        )}
      </main>
    </AppShell>
  );
}
