import { productBySku } from "./catalog";
import type { Channel, Destinations, Organism } from "./types";
import { copyToClipboard } from "./utils";

export type DeployTarget = {
  id: string;
  label: string;
  href: string;
  hint: string;
};

export const DEFAULT_DESTINATIONS: Destinations = {
  xHandle: "DupreJesse14633",
  redditUser: "",
  redditSub: "smallbusiness",
};

export const REDDIT_SUBS = [
  "smallbusiness",
  "Entrepreneur",
  "productivity",
  "automation",
  "ChatGPT",
  "SEO",
  "sales",
];

export function destOf(dest?: Destinations | null): Destinations {
  return {
    xHandle: stripAt(dest?.xHandle || DEFAULT_DESTINATIONS.xHandle),
    redditUser: stripAt(dest?.redditUser || ""),
    redditSub: stripSub(dest?.redditSub || DEFAULT_DESTINATIONS.redditSub),
  };
}

function stripAt(value: string) {
  return value.trim().replace(/^@/, "");
}

function stripSub(value: string) {
  return value.trim().replace(/^\/?(r\/)?/i, "").replace(/\s+/g, "");
}

export function organismPacket(organism: Organism) {
  if (organism.channel === "search") return googleAdsCopy(organism);
  return [
    organism.headline,
    "",
    organism.body,
    "",
    `Proof: ${organism.proofHook}`,
    `CTA: ${organism.cta}`,
    organism.landingUrl,
  ].join("\n");
}

export function googleAdsCopy(organism: Organism) {
  const product = productBySku(organism.sku);
  const h1 = clip(organism.headline, 30);
  const h2 = clip(product?.name ?? organism.sku, 30);
  const d1 = clip(organism.body, 90);
  return [
    `Headline 1: ${h1}`,
    `Headline 2: ${h2}`,
    `Description: ${d1}`,
    `Final URL: ${organism.landingUrl}`,
  ].join("\n");
}

function clip(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export function tweetText(organism: Organism) {
  const core = `${organism.headline}\n\n${organism.body}\n\n${organism.landingUrl}`;
  return core.length <= 280 ? core : `${organism.headline}\n\n${organism.landingUrl}`.slice(0, 280);
}

export function redditSubmitUrl(organism: Organism, dest?: Destinations) {
  const d = destOf(dest);
  const product = productBySku(organism.sku);
  const title = clip(organism.headline || product?.job || organism.sku, 300);
  const by = d.redditUser ? `\n\n— u/${d.redditUser}` : "";
  const body = `${organism.body}\n\n${organism.proofHook}\n\n${organism.landingUrl}${by}`;
  const sub = d.redditSub || "smallbusiness";
  return `https://www.reddit.com/r/${encodeURIComponent(sub)}/submit?title=${encodeURIComponent(title)}&text=${encodeURIComponent(body)}`;
}

export function xIntentUrl(organism: Organism) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText(organism))}`;
}

export function xProfileUrl(dest?: Destinations) {
  const handle = destOf(dest).xHandle;
  return handle ? `https://x.com/${encodeURIComponent(handle)}` : "https://x.com/";
}

export function redditUserUrl(dest?: Destinations) {
  const user = destOf(dest).redditUser;
  return user ? `https://www.reddit.com/user/${encodeURIComponent(user)}` : "https://www.reddit.com/";
}

export function deployTargets(organism: Organism, dest?: Destinations): DeployTarget[] {
  const d = destOf(dest);
  if (organism.channel === "search") {
    return [
      {
        id: "google-ads",
        label: "Open Google Ads",
        href: "https://ads.google.com/aw/campaigns",
        hint: "Packet is RSA-ready. Paste into a Search campaign. Google bills that account — SWARM does not.",
      },
    ];
  }
  if (organism.channel === "proof") {
    return [
      {
        id: "site",
        label: "Open the live spec",
        href: organism.landingUrl,
        hint: "Proof-loop is the spec on multinicheai.com. The UTM link is live.",
      },
    ];
  }
  const x: DeployTarget = {
    id: "x",
    label: d.xHandle ? `Post on X as @${d.xHandle}` : "Post on X",
    href: xIntentUrl(organism),
    hint: "Opens X compose with the intercept filled. Posts from the account you are logged into.",
  };
  const reddit: DeployTarget = {
    id: "reddit",
    label: `Post to r/${d.redditSub}`,
    href: redditSubmitUrl(organism, d),
    hint: d.redditUser
      ? `Opens Reddit submit in r/${d.redditSub} as u/${d.redditUser}. Native listing, not a banner.`
      : `Opens Reddit submit in r/${d.redditSub}. Add your Reddit username in Destinations if you want it signed.`,
  };
  if (organism.channel === "conversation") return [x, reddit];
  return [reddit, x];
}

export function deployTarget(organism: Organism, dest?: Destinations): DeployTarget {
  return deployTargets(organism, dest)[0]!;
}

export function channelVerb(channel: Channel) {
  if (channel === "search") return "Ship to Google Ads";
  if (channel === "conversation") return "Post on X + Reddit";
  if (channel === "proof") return "Open the live spec";
  return "Post to Reddit";
}

export async function copyOrganismPacket(organism: Organism) {
  return copyToClipboard(organismPacket(organism));
}

export async function shareOrganism(organism: Organism) {
  const text = organismPacket(organism);
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: organism.headline,
        text,
        url: organism.landingUrl,
      });
      return "shared" as const;
    } catch {
      // cancelled
    }
  }
  const ok = await copyToClipboard(text);
  return ok ? ("copied" as const) : ("failed" as const);
}
