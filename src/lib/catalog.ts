import type { Campaign, FilterId, Format, Placement, Signal, Variant } from "./types";

export const FORMAT_LABEL: Record<Format, string> = {
  search: "Search intercept",
  conversation: "Conversation native",
  proof: "Proof-loop",
  shadow: "Shadow listing",
};

export const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "search", label: "Search intercept" },
  { id: "conversation", label: "Conversation native" },
  { id: "proof", label: "Proof-loop" },
  { id: "shadow", label: "Shadow listing" },
];

export const DEST_LABEL = {
  google: "Google",
  x: "X",
  site: "the site",
} as const;

export const FORMAT_DEST: Record<Format, "google" | "x" | "site"> = {
  search: "google",
  conversation: "x",
  proof: "site",
  shadow: "site",
};

export const CAMPAIGNS: Campaign[] = [
  {
    id: "weatherfoil",
    name: "Weatherfoil",
    brief: "The shell for sideways North Atlantic rain. Launch packet.",
    budget: 48_000,
  },
  {
    id: "carry",
    name: "Tide Pack",
    brief: "32 litres, dry-bag roll, one-bag week on wet ground.",
    budget: 22_000,
  },
  {
    id: "layer",
    name: "Salt & analog",
    brief: "Merino that salts in, and the logbook that stays offline.",
    budget: 14_000,
  },
];

export const PLACEMENTS: Placement[] = [
  {
    id: "wf-search",
    campaignId: "weatherfoil",
    format: "search",
    product: "Weatherfoil Shell",
    headline: "The shell that disappears in weather",
    body: "Three-layer membrane. Welded seams. Cut for a week of sideways rain on the North Atlantic.",
    cta: "See the shell",
    query: "best rain jacket iceland",
    keywords: ["rain", "jacket", "iceland", "waterproof", "weather", "faroe", "shell", "storm"],
    lab: { impressions: 18420, ctr: 4.8, dwell: 6.2, proof: 0.71 },
    live: null,
    status: "lab",
    destination: null,
    shippedAt: null,
  },
  {
    id: "wf-convo",
    campaignId: "weatherfoil",
    format: "conversation",
    product: "Weatherfoil Shell",
    headline: "Wear a quiet shell, not a puffy",
    body: "October in the Faroes is wet and windy more than it is cold. Weatherfoil is the outer that stays silent in sideways rain.",
    cta: "Pack the shell",
    prompt: "What should I wear for a week in the Faroes in October?",
    reply:
      "October in the Faroes is wet and windy more than it is cold. Skip a puffy as your outer — you want a shell that stays quiet in sideways rain and a merino layer underneath.",
    keywords: ["faroe", "wear", "october", "jacket", "pack", "iceland", "rain", "trip"],
    lab: { impressions: 9620, ctr: 6.1, dwell: 11.4, proof: 0.84 },
    live: null,
    status: "lab",
    destination: null,
    shippedAt: null,
  },
  {
    id: "wf-proof",
    campaignId: "weatherfoil",
    format: "proof",
    product: "Weatherfoil Shell",
    headline: "Proof the shell before the network does",
    body: "The packet sits in a closed loop on keel.studio. Lab numbers tick. Nothing reaches Google or X until you ship.",
    cta: "Ship to the site",
    lab: { impressions: 4100, ctr: 9.2, dwell: 18.0, proof: 0.93 },
    live: null,
    status: "lab",
    destination: null,
    shippedAt: null,
  },
  {
    id: "tide-search",
    campaignId: "carry",
    format: "search",
    product: "Tide Pack 32",
    headline: "One bag. A wet week. No dry-sack theatre.",
    body: "Roll-top, taped seams, hip belt that actually carries. Built for ferry decks and bog boardwalks.",
    cta: "See the pack",
    query: "waterproof hiking pack 30l",
    keywords: ["pack", "backpack", "waterproof", "hiking", "30l", "32", "bag", "carry"],
    lab: { impressions: 12110, ctr: 3.9, dwell: 5.1, proof: 0.64 },
    live: null,
    status: "lab",
    destination: null,
    shippedAt: null,
  },
  {
    id: "tide-proof",
    campaignId: "carry",
    format: "proof",
    product: "Tide Pack 32",
    headline: "The pack, looping on the site",
    body: "A proof-loop is not a placement Google will sell you. It lives on the site until the packet ships.",
    cta: "Ship the pack",
    lab: { impressions: 2880, ctr: 8.4, dwell: 16.2, proof: 0.88 },
    live: null,
    status: "lab",
    destination: null,
    shippedAt: null,
  },
  {
    id: "salt-convo",
    campaignId: "layer",
    format: "conversation",
    product: "Salt Wool",
    headline: "Merino that wants the salt",
    body: "190 g/m². No antimicrobial theatre. Wear it three days on the coast and wash it in a sink.",
    cta: "See Salt Wool",
    prompt: "Do I need merino for a wet coastal trek or is a fleece enough?",
    reply:
      "Fleece over a cotton base will hold water against you. A midweight merino next to skin, then a shell, is the quieter stack for a wet coast.",
    keywords: ["merino", "wool", "fleece", "layer", "base", "trek", "coast", "wet"],
    lab: { impressions: 7440, ctr: 5.4, dwell: 9.8, proof: 0.77 },
    live: null,
    status: "lab",
    destination: null,
    shippedAt: null,
  },
  {
    id: "salt-shadow",
    campaignId: "layer",
    format: "shadow",
    product: "Salt Wool",
    headline: "Keel Salt Wool — North Sea merino",
    body: "Atelier knit in Bergen. Ships weekly. Looks like a maker listing because that is the point.",
    cta: "Visit the atelier",
    listing: {
      category: "Outdoor · Layers",
      rating: 4.9,
      reviews: 128,
      place: "Bergen atelier",
      note: "Listed near you · ships weekly",
    },
    lab: { impressions: 15600, ctr: 2.7, dwell: 7.4, proof: 0.58 },
    live: null,
    status: "lab",
    destination: null,
    shippedAt: null,
  },
  {
    id: "field-shadow",
    campaignId: "layer",
    format: "shadow",
    product: "Field Notes logbook",
    headline: "Keel Field Notes — analog log",
    body: "Waxed cover, numbered pages, no app. Sits in local stationer results as if it had always been there.",
    cta: "Order the log",
    listing: {
      category: "Stationery · Outdoor",
      rating: 4.8,
      reviews: 64,
      place: "Coastal stationers",
      note: "In stock · unlined and squared",
    },
    lab: { impressions: 8900, ctr: 3.1, dwell: 8.0, proof: 0.61 },
    live: null,
    status: "lab",
    destination: null,
    shippedAt: null,
  },
];

export const VARIANTS: Variant[] = [
  {
    id: "wf-search-a",
    placementId: "wf-search",
    headline: "The shell that disappears in weather",
    body: "Three-layer membrane. Welded seams. Cut for a week of sideways rain on the North Atlantic.",
    cta: "See the shell",
    labCtr: 4.8,
  },
  {
    id: "wf-search-b",
    placementId: "wf-search",
    headline: "Iceland will not notice you in this",
    body: "A weatherfoil shell is cut for sideways rain, not for a city commute with a hood up.",
    cta: "Cut for the Atlantic",
    labCtr: 5.3,
  },
  {
    id: "wf-search-c",
    placementId: "wf-search",
    headline: "Stop buying rain jackets that shout",
    body: "Quiet cloth. Welded seams. The membrane is the product, not the logo.",
    cta: "Wear it quiet",
    labCtr: 4.1,
  },
  {
    id: "wf-convo-a",
    placementId: "wf-convo",
    headline: "Wear a quiet shell, not a puffy",
    body: "October in the Faroes is wet and windy more than it is cold. Weatherfoil is the outer that stays silent in sideways rain.",
    cta: "Pack the shell",
    labCtr: 6.1,
  },
  {
    id: "wf-convo-b",
    placementId: "wf-convo",
    headline: "The Faroes will wet whatever you pack",
    body: "Pack merino and a three-layer shell. Leave the down for the hut.",
    cta: "Pack Weatherfoil",
    labCtr: 6.8,
  },
  {
    id: "wf-convo-c",
    placementId: "wf-convo",
    headline: "A puffy is a wet sponge in Tórshavn",
    body: "The correct outer is a welded shell. Keel Weatherfoil is that outer.",
    cta: "See why",
    labCtr: 5.5,
  },
  {
    id: "tide-proof-a",
    placementId: "tide-proof",
    headline: "The pack, looping on the site",
    body: "A proof-loop is not a placement Google will sell you. It lives on the site until the packet ships.",
    cta: "Ship the pack",
    labCtr: 8.4,
  },
  {
    id: "tide-proof-b",
    placementId: "tide-proof",
    headline: "32 litres, still dry on day six",
    body: "Roll-top proof, on the site, until you decide the network may have it.",
    cta: "Ship to the site",
    labCtr: 7.9,
  },
  {
    id: "salt-shadow-a",
    placementId: "salt-shadow",
    headline: "Keel Salt Wool — North Sea merino",
    body: "Atelier knit in Bergen. Ships weekly. Looks like a maker listing because that is the point.",
    cta: "Visit the atelier",
    labCtr: 2.7,
  },
  {
    id: "salt-shadow-b",
    placementId: "salt-shadow",
    headline: "Salt Wool, Bergen — 190 g merino",
    body: "A listing that reads as a maker, not a unit. Shadow is the format.",
    cta: "See the knit",
    labCtr: 3.4,
  },
];

export const SIGNAL_POOL: Omit<Signal, "id" | "at">[] = [
  { kind: "query", text: "best rain jacket iceland", matchId: "wf-search", score: 0.94 },
  { kind: "query", text: "waterproof hiking pack 30l", matchId: "tide-search", score: 0.91 },
  { kind: "query", text: "quiet hardshell for ferry travel", matchId: "wf-search", score: 0.82 },
  { kind: "opening", text: "What should I wear for a week in the Faroes in October?", matchId: "wf-convo", score: 0.96 },
  { kind: "opening", text: "Do I need merino for a wet coastal trek?", matchId: "salt-convo", score: 0.88 },
  { kind: "opening", text: "Jacket vs puffy for Tórshavn in autumn", matchId: "wf-convo", score: 0.79 },
  { kind: "listing", text: "North Sea merino near Bergen", matchId: "salt-shadow", score: 0.86 },
  { kind: "listing", text: "waxed outdoor logbook, local stock", matchId: "field-shadow", score: 0.81 },
  { kind: "query", text: "one bag packing wet coast", matchId: "tide-search", score: 0.74 },
];

export const ORGANIC_RESULTS: Record<string, { title: string; url: string; blurb: string }[]> = {
  "wf-search": [
    {
      title: "Northfold 2L rain shell review — 2026",
      url: "trailcloth.example/northfold-2l",
      blurb: "A city-cut 2-layer shell. Fine in a shower, loud in a gale.",
    },
    {
      title: "Harbor Cloth Storm Coat",
      url: "harborcloth.example/storm",
      blurb: "Waxed cotton overcoat. Heavy, handsome, not a hiking shell.",
    },
  ],
  "tide-search": [
    {
      title: "Ridge 28L daypack — buyer notes",
      url: "ridgehaul.example/28",
      blurb: "Mesh back, no roll-top. Fine until the bog starts.",
    },
    {
      title: "Ferry tote vs hiking pack",
      url: "decknotes.example/carry",
      blurb: "Why a tote fails on day two of a wet traverse.",
    },
  ],
};

export function campaignOf(id: string) {
  return CAMPAIGNS.find((c) => c.id === id);
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPct(n: number) {
  return `${n.toFixed(1)}%`;
}

export function formatSec(n: number) {
  return `${n.toFixed(1)}s`;
}

export function matchesQuery(placement: Placement, q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const keys = placement.keywords ?? [];
  return words.some((w) => keys.some((k) => k.includes(w) || w.includes(k)));
}
