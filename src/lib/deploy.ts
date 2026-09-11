import { productBySku } from "./catalog";
import type { Channel, Organism } from "./types";
import { copyToClipboard } from "./utils";

export type DeployTarget = {
  id: string;
  label: string;
  href: string;
  hint: string;
};

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

export function deployTarget(organism: Organism): DeployTarget {
  const product = productBySku(organism.sku);
  if (organism.channel === "search") {
    return {
      id: "google-ads",
      label: "Open Google Ads",
      href: "https://ads.google.com/aw/campaigns",
      hint: "Packet is RSA-ready. Paste headlines, description, and the UTM final URL into a Search campaign. Google bills that account — SWARM does not.",
    };
  }
  if (organism.channel === "conversation") {
    const text = tweetText(organism);
    return {
      id: "x",
      label: "Post on X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      hint: "Opens a real X compose with the intercept already filled. Posting is you, on your account.",
    };
  }
  if (organism.channel === "proof") {
    return {
      id: "site",
      label: "Open the live spec",
      href: organism.landingUrl,
      hint: "Proof-loop is the spec sheet on multinicheai.com. The UTM link is live. Anyone who lands is a real visitor.",
    };
  }
  const title = product?.job ?? organism.headline;
  const body = `${organism.body}\n\n${organism.landingUrl}`;
  return {
    id: "reddit",
    label: "Post a shadow listing",
    href: `https://www.reddit.com/submit?title=${encodeURIComponent(title)}&text=${encodeURIComponent(body)}`,
    hint: "Opens Reddit submit with the native listing. Pick the thread. Not a banner — a reply people would actually post.",
  };
}

export function channelVerb(channel: Channel) {
  if (channel === "search") return "Ship to Google Ads";
  if (channel === "conversation") return "Post on X";
  if (channel === "proof") return "Open the live spec";
  return "Post the listing";
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
      // user cancelled or share failed — fall through to copy
    }
  }
  const ok = await copyToClipboard(text);
  return ok ? ("copied" as const) : ("failed" as const);
}
