export type Format = "search" | "conversation" | "proof" | "shadow";
export type Status = "lab" | "live";
export type Destination = "google" | "x" | "site";

export type Metrics = {
  impressions: number;
  ctr: number;
  dwell: number;
  proof: number;
};

export type Placement = {
  id: string;
  campaignId: string;
  format: Format;
  product: string;
  headline: string;
  body: string;
  cta: string;
  query?: string;
  keywords?: string[];
  prompt?: string;
  reply?: string;
  listing?: {
    category: string;
    rating: number;
    reviews: number;
    place: string;
    note: string;
  };
  lab: Metrics;
  live: Metrics | null;
  status: Status;
  destination: Destination | null;
  shippedAt: number | null;
};

export type Campaign = {
  id: string;
  name: string;
  brief: string;
  budget: number;
};

export type Variant = {
  id: string;
  placementId: string;
  headline: string;
  body: string;
  cta: string;
  labCtr: number;
};

export type SignalKind = "query" | "opening" | "listing" | "packet";

export type Signal = {
  id: string;
  kind: SignalKind;
  text: string;
  matchId: string;
  score: number;
  at: number;
};

export type FilterId = "all" | Format;
