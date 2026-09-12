import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { FORMAT_LABEL } from "@/lib/catalog";
import { useLab } from "@/lib/store";
import type { Format } from "@/lib/types";

export const Route = createFileRoute("/more")({ component: MorePage });

const GLOSSARY: { id: Format; copy: string }[] = [
  {
    id: "search",
    copy: "Sits on the query, above organic. The search is the inventory. Type a query in Studio — if it misses intent, the intercept does not fire.",
  },
  {
    id: "conversation",
    copy: "Lives inside an assistant reply. Labeled. Not a banner. Only appears when the thread is actually about the product.",
  },
  {
    id: "proof",
    copy: "The format that does not exist in the ad networks. The creative loops on the site. Lab numbers tick. Go live ships the packet; until then everything is simulated.",
  },
  {
    id: "shadow",
    copy: "Reads as an organic listing — maker, directory, stationer. A hairline ‘placed’ mark. Lift the shadow in Studio to see the buy.",
  },
];

function MorePage() {
  const reset = useLab((s) => s.resetLab);
  const live = useLab((s) => s.placements.filter((p) => p.status === "live").length);

  return (
    <AppShell>
      <main className="px-5 pt-8 md:pt-10">
        <p className="text-[0.7rem] font-medium tracking-[0.22em] text-subtle uppercase">
          More
        </p>
        <h1 className="mt-3 font-display text-[2.15rem] leading-[1.12] tracking-tight">
          Lab, live, and the four formats
        </h1>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted">
          Placement is a studio for Keel, a North Sea outdoor house. Nothing
          here spends real money. Go live is a packet to a simulated channel.
        </p>

        <section className="mt-8">
          <h2 className="text-[0.7rem] font-medium tracking-[0.18em] text-subtle uppercase">
            Lab versus live
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Every number in Studio is simulated until you ship. Radar still
            shows intercepts so you can see how the channel would fire. After
            Go live, the unit leaves the loop and the tape marks the packet as
            shipped to Google, X, or the site.
          </p>
        </section>

        <ul className="mt-8 space-y-5">
          {GLOSSARY.map((g) => (
            <li key={g.id} className="rounded-2xl bg-elevated p-4">
              <h3 className="font-display text-xl text-fg">{FORMAT_LABEL[g.id]}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{g.copy}</p>
            </li>
          ))}
        </ul>

        <section className="mt-10 mb-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm text-muted">
            {live} packet{live === 1 ? "" : "s"} currently live in this lab.
          </p>
          <Button variant="ghost" className="mt-4 w-full" onClick={reset}>
            Reset the lab
          </Button>
        </section>
      </main>
    </AppShell>
  );
}
