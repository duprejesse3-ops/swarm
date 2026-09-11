import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, Monitor, Smartphone } from "lucide-react";
import {
  getDeferredPrompt,
  isStandalone,
  platformOf,
  promptInstall,
  subscribeInstall,
} from "@/lib/install";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/install")({ component: InstallPage });

function InstallPage() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const platform = platformOf();

  useEffect(() => {
    setInstalled(isStandalone());
    setCanPrompt(Boolean(getDeferredPrompt()));
    return subscribeInstall(() => {
      setCanPrompt(Boolean(getDeferredPrompt()));
      setInstalled(isStandalone());
    });
  }, []);

  async function install() {
    const result = await promptInstall();
    if (result.ok && result.outcome === "accepted") {
      toast.success("SWARM installed");
      setInstalled(true);
      return;
    }
    toast.message("Use the steps for your device", {
      description: "Chrome and Edge will also show an install icon in the address bar.",
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-2xl">
        <Badge variant="accent">Android · Windows</Badge>
        <h1 className="mt-4 text-4xl font-medium tracking-tight">Install SWARM as an app</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          One tap from Chrome or Edge. Autopilot keeps hijacking intent, evolving winners, and
          writing proof-first ads while the app sits on your home screen or Start menu. No Play
          Store listing, no Microsoft Store listing — the install is the site, as a real app window.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => void install()} disabled={installed}>
            <Download className="size-4" />
            {installed ? "Already installed" : canPrompt ? "Install SWARM" : "Install when prompted"}
          </Button>
          <Button asChild variant="outline">
            <a href="https://github.com/duprejesse3-ops/swarm" target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-accent" />
              <h2 className="text-lg font-medium">Android</h2>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-muted">
              <Step n="1" text="Open this app in Chrome (not in-app browsers)." />
              <Step n="2" text="Tap Install SWARM above, or Chrome menu → Install app / Add to Home screen." />
              <Step n="3" text="Launch SWARM from the home screen. Autopilot is on by default." />
            </ol>
            {platform === "android" ? (
              <p className="mt-4 text-xs text-accent">This device looks like Android.</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2">
              <Monitor className="size-4 text-accent" />
              <h2 className="text-lg font-medium">Windows</h2>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-muted">
              <Step n="1" text="Open in Edge or Chrome on Windows." />
              <Step n="2" text="Click Install SWARM, or the install icon in the address bar." />
              <Step n="3" text="Pin to Start or taskbar. Keyboard: 1–5 to move, A for autopilot, I for this page." />
            </ol>
            {platform === "windows" ? (
              <p className="mt-4 text-xs text-accent">This device looks like Windows.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <h2 className="text-lg font-medium">What “fully automatic” means</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Autopilot hijacks new intent pulses and spawns organisms — no click required.</li>
            <li>Running swarms tick on their own. Ripe swarms evolve. Losers die.</li>
            <li>Copy stays proof-first. Grok writes copy only when you ask it to, so autopilot cannot burn API quota.</li>
            <li>Deploy packets still copy out of Studio / Swarm when you are ready to paste into Google, X, or a thread.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated font-mono text-[11px]">
        {n}
      </span>
      <span className="pt-0.5">{text}</span>
    </li>
  );
}
