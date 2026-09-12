import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChannelMock, Monitor } from "@/components/channel-mocks";
import { FormatChips } from "@/components/format-chips";
import { StatusPill } from "@/components/metrics";
import { FORMAT_LABEL } from "@/lib/catalog";
import { useLab } from "@/lib/store";
import type { FilterId } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Studio });

function Studio() {
  const [filter, setFilter] = useState<FilterId>("all");
  const placements = useLab((s) => s.placements);
  const visible = useMemo(
    () => (filter === "all" ? placements : placements.filter((p) => p.format === filter)),
    [filter, placements],
  );

  return (
    <AppShell>
      <main className="px-5 pt-8 md:px-8 md:pt-10">
        <p className="text-[0.7rem] font-medium tracking-[0.22em] text-subtle uppercase">
          Placement Studio
        </p>
        <h1 className="mt-3 font-display text-[2.15rem] leading-[1.12] tracking-tight text-fg md:text-5xl">
          See the ad as
          <br />
          the channel will
        </h1>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted">
          Proof-loop is the format that does not exist in the ad networks. Go live
          ships the packet to Google, X, or the site. Lab numbers stay simulated
          until you do.
        </p>

        <div className="mt-6">
          <FormatChips value={filter} onChange={setFilter} />
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-5 pb-6 md:grid-cols-2">
          {visible.map((p) => (
            <li key={p.id}>
              <Link to="/p/$id" params={{ id: p.id }} className="block">
                <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
                  <p className="text-sm text-muted">
                    {FORMAT_LABEL[p.format]}
                    <span className="text-subtle"> · {p.product}</span>
                  </p>
                  <StatusPill placement={p} />
                </div>
                <Monitor
                  label={
                    p.format === "proof"
                      ? "Proof monitor"
                      : p.format === "search"
                        ? "Search surface"
                        : p.format === "conversation"
                          ? "Conversation"
                          : "Directory"
                  }
                >
                  <ChannelMock placement={p} compact />
                </Monitor>
              </Link>
            </li>
          ))}
          {visible.length === 0 ? (
            <li className="rounded-2xl bg-elevated px-4 py-10 text-center text-sm text-muted">
              Nothing in this format yet.
            </li>
          ) : null}
        </ul>
      </main>
    </AppShell>
  );
}
