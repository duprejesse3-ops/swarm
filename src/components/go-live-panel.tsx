import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Radio, Share2, Undo2 } from "lucide-react";
import { channelVerb, copyOrganismPacket, deployTarget, shareOrganism } from "@/lib/deploy";
import { useSwarmStore } from "@/lib/store";
import type { Organism } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GoLivePanel({ organism }: { organism: Organism }) {
  const goLive = useSwarmStore((s) => s.goLive);
  const pullFromLive = useSwarmStore((s) => s.pullFromLive);
  const [open, setOpen] = useState(false);
  const target = deployTarget(organism);
  const isLive = organism.status === "live";

  async function ship() {
    const copied = await copyOrganismPacket(organism);
    if (copied) {
      toast.success("Packet copied", { description: "Paste it into the tab that opens." });
    }
    window.open(target.href, "_blank", "noopener,noreferrer");
    goLive(organism.id);
    setOpen(false);
  }

  async function share() {
    const result = await shareOrganism(organism);
    if (result === "shared") {
      goLive(organism.id);
      toast.success("Shared — marked live");
      return;
    }
    if (result === "copied") {
      toast.success("Copied. Paste into the app you post from.");
      goLive(organism.id);
      return;
    }
    toast.message("Could not share", { description: "Copy the packet from Studio instead." });
  }

  if (isLive) {
    return (
      <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-success">Live — not a sim</p>
        <p className="mt-2 text-sm text-muted">
          Lab is frozen on this card. Real clicks come through the UTM link. SWARM still does not
          bill you.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <a href={target.href} target="_blank" rel="noreferrer">
              {target.label}
              <ExternalLink className="size-4" />
            </a>
          </Button>
          <Button variant="outline" onClick={() => pullFromLive(organism.id)}>
            <Undo2 className="size-4" />
            Back to lab
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-subtle">Make it real</p>
        <p className="mt-2 text-sm text-muted">
          Lab numbers are simulated. Go live copies the ad, opens the real destination, and freezes
          this card. SWARM does not charge you. Google or X will, if you use those accounts.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setOpen(true)}>
            <Radio className="size-4" />
            {channelVerb(organism.channel)}
          </Button>
          <Button variant="outline" onClick={() => void share()}>
            <Share2 className="size-4" />
            Share from phone
          </Button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Go live — {channelVerb(organism.channel)}</DialogTitle>
            <DialogDescription>{target.hint}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted">{organism.headline}</p>
          <p className="mt-2 min-w-0 truncate font-mono text-[11px] text-subtle">
            {organism.landingUrl}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => void ship()}>
              Copy packet and {target.label.toLowerCase()}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Stay in lab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
