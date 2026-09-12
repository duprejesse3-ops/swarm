import { useMemo, useState } from "react";
import { ArrowUpRight, MapPin, Search, Star } from "lucide-react";
import { matchesQuery, ORGANIC_RESULTS } from "@/lib/catalog";
import type { Placement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { KeelMark } from "./keel-mark";

export function Monitor({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]",
        className,
      )}
    >
      {label ? (
        <div className="flex items-center justify-between px-3 pt-2.5 text-[0.65rem] font-medium tracking-[0.16em] text-subtle uppercase">
          <span>{label}</span>
          <span className="flex gap-1">
            <i className="size-1.5 rounded-full bg-subtle/80" />
            <i className="size-1.5 rounded-full bg-subtle/50" />
          </span>
        </div>
      ) : null}
      <div className="relative">
        {children}
        <div className="monitor-scan pointer-events-none absolute inset-0" />
      </div>
    </div>
  );
}

export function ChannelMock({
  placement,
  interactive = false,
  compact = false,
}: {
  placement: Placement;
  interactive?: boolean;
  compact?: boolean;
}) {
  switch (placement.format) {
    case "search":
      return (
        <SearchIntercept
          placement={placement}
          interactive={interactive}
          compact={compact}
        />
      );
    case "conversation":
      return (
        <ConversationNative
          placement={placement}
          interactive={interactive}
          compact={compact}
        />
      );
    case "proof":
      return <ProofLoop placement={placement} compact={compact} />;
    case "shadow":
      return (
        <ShadowListing
          placement={placement}
          interactive={interactive}
          compact={compact}
        />
      );
  }
}

function SearchIntercept({
  placement,
  interactive,
  compact,
}: {
  placement: Placement;
  interactive: boolean;
  compact: boolean;
}) {
  const [q, setQ] = useState(placement.query ?? "");
  const hit = matchesQuery(placement, q);
  const organic = ORGANIC_RESULTS[placement.id] ?? ORGANIC_RESULTS["wf-search"];

  return (
    <div className={cn("px-3 pb-3", compact ? "pt-2" : "pt-3")}>
      <div className="flex items-center gap-2 rounded-full bg-chip px-3 py-2 shadow-[var(--shadow-border)]">
        <Search className="size-3.5 text-subtle" />
        {interactive ? (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search query"
            className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
            placeholder="Type a query"
          />
        ) : (
          <span className="truncate text-sm text-fg">{placement.query}</span>
        )}
      </div>

      <div className={cn("mt-3 space-y-3", compact && "max-h-56 overflow-hidden")}>
        {hit ? (
          <article className="rounded-xl bg-chip-active/80 p-3">
            <p className="text-[0.65rem] font-medium tracking-[0.14em] text-accent uppercase">
              Intercept · {placement.status === "live" ? "live" : "lab"}
            </p>
            <div className="mt-2 flex items-start gap-3">
              <KeelMark className="mt-0.5 size-7 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-fg">{placement.headline}</p>
                <p className="mt-1 text-sm leading-snug text-muted">{placement.body}</p>
                <p className="mt-2 text-sm text-accent">
                  {placement.cta} <ArrowUpRight className="inline size-3.5" />
                </p>
              </div>
            </div>
          </article>
        ) : (
          <p className="rounded-xl bg-chip px-3 py-2 text-sm text-muted">
            No intercept. Query misses Weatherfoil intent.
          </p>
        )}

        {organic.map((r) => (
          <article key={r.url} className="px-1">
            <p className="truncate text-xs text-subtle">{r.url}</p>
            <p className="text-sm text-fg/90">{r.title}</p>
            <p className="text-sm leading-snug text-muted">{r.blurb}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ConversationNative({
  placement,
  interactive,
  compact,
}: {
  placement: Placement;
  interactive: boolean;
  compact: boolean;
}) {
  const prompts = useMemo(
    () => [
      placement.prompt ?? "What should I pack?",
      "Best coffee in Bergen",
      "Do I need merino on a wet coast?",
    ],
    [placement.prompt],
  );
  const [prompt, setPrompt] = useState(prompts[0]);
  const hit = matchesQuery(placement, prompt);

  return (
    <div className={cn("px-3 pb-3", compact ? "pt-2" : "pt-3")}>
      {interactive ? (
        <div className="mb-3 flex gap-1.5 overflow-x-auto">
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(p)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors",
                p === prompt ? "bg-chip-active text-fg" : "bg-chip text-muted",
              )}
            >
              {p.length > 34 ? `${p.slice(0, 32)}…` : p}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-chip px-3 py-2 text-sm leading-snug text-fg">
          {prompt}
        </p>
      </div>

      <div className={cn("mt-2 max-w-[92%] space-y-2", compact && "max-h-52 overflow-hidden")}>
        <p className="rounded-2xl rounded-bl-md bg-elevated px-3 py-2 text-sm leading-relaxed text-fg/90">
          {hit
            ? placement.reply
            : "I can help with that — nothing in this thread maps to a placed packet yet. Try a coastal packing or layer question."}
        </p>
        {hit ? (
          <article className="rounded-xl bg-chip-active/70 p-3">
            <p className="text-[0.65rem] font-medium tracking-[0.14em] text-accent uppercase">
              Placed · conversation native
            </p>
            <div className="mt-2 flex items-start gap-3">
              <KeelMark className="mt-0.5 size-6 shrink-0" />
              <div>
                <p className="font-medium text-fg">{placement.headline}</p>
                <p className="mt-1 text-sm leading-snug text-muted">{placement.body}</p>
                <p className="mt-2 text-sm text-accent">{placement.cta}</p>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}

function ProofLoop({ placement, compact }: { placement: Placement; compact: boolean }) {
  const live = placement.status === "live";
  return (
    <div className={cn("relative px-3 pb-4", compact ? "pt-3" : "pt-4")}>
      <div className="relative mx-auto aspect-square w-[min(100%,16rem)]">
        <div className="absolute inset-0 rounded-full border border-border" />
        <div className="absolute inset-6 rounded-full border border-border-strong" />
        <div className="absolute inset-12 rounded-full bg-chip/80" />
        <div className="packet-orbit absolute inset-0">
          <span
            className={cn(
              "absolute top-0 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
              live ? "bg-accent" : "bg-fg",
            )}
          />
        </div>
        <div className="absolute inset-12 flex flex-col items-center justify-center px-4 text-center">
          <KeelMark className="mb-2 size-6" />
          <p className="font-display text-lg leading-tight text-fg">{placement.product}</p>
          <p className="mt-1 text-[0.65rem] tracking-[0.16em] text-subtle uppercase">
            {live ? "On the site" : "Closed loop"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[0.65rem] tracking-[0.14em] text-subtle uppercase">
        <span>Studio</span>
        <span>Proof</span>
        <span className={live ? "text-accent" : undefined}>Channel</span>
      </div>
      <p className="mt-2 text-center text-sm text-muted">{placement.headline}</p>
    </div>
  );
}

function ShadowListing({
  placement,
  interactive,
  compact,
}: {
  placement: Placement;
  interactive: boolean;
  compact: boolean;
}) {
  const [lifted, setLifted] = useState(false);
  const L = placement.listing;
  return (
    <div className={cn("px-3 pb-3", compact ? "pt-2" : "pt-3")}>
      <article
        className={cn(
          "flex gap-3 rounded-xl p-3 transition-colors",
          lifted ? "bg-chip-active" : "bg-chip",
        )}
      >
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-elevated">
          <KeelMark className="size-8" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-fg">{placement.headline}</p>
          <p className="mt-0.5 text-xs text-muted">{L?.category}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-fg/90">
            <Star className="size-3.5 fill-accent text-accent" />
            <span className="tabular-nums">{L?.rating.toFixed(1)}</span>
            <span className="text-subtle">({L?.reviews})</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <MapPin className="size-3" />
            {L?.note}
          </p>
        </div>
      </article>
      <div className="mt-2 flex items-center justify-between px-1">
        <p
          className={cn(
            "text-[0.65rem] tracking-[0.14em] uppercase",
            lifted ? "text-accent" : "text-subtle/80",
          )}
        >
          {lifted ? "Placed · shadow lifted" : "Placed"}
        </p>
        {interactive && !compact ? (
          <button
            type="button"
            onClick={() => setLifted((v) => !v)}
            className="text-xs text-muted hover:text-fg"
          >
            {lifted ? "Drop shadow" : "Lift the shadow"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
