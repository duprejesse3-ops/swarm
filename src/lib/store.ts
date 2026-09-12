import { create } from "zustand";
import { CAMPAIGNS, PLACEMENTS, SIGNAL_POOL, VARIANTS } from "./catalog";
import type { Destination, Placement, Variant } from "./types";

function clonePlacements(): Placement[] {
  return PLACEMENTS.map((p) => ({
    ...p,
    lab: { ...p.lab },
    live: p.live ? { ...p.live } : null,
    listing: p.listing ? { ...p.listing } : undefined,
    keywords: p.keywords ? [...p.keywords] : undefined,
  }));
}

function seedSignals() {
  return SIGNAL_POOL.slice(0, 6).map((s, i) => ({
    ...s,
    id: `sig-${i}`,
    at: 0,
  }));
}

type State = {
  placements: Placement[];
  variants: Variant[];
  activeVariant: Record<string, string>;
  swarm: Record<string, string[]>;
  signals: ReturnType<typeof seedSignals>;
  clock: number;
  goLive: (id: string, destination: Destination) => void;
  pullBack: (id: string) => void;
  promoteVariant: (placementId: string, variantId: string) => void;
  toggleInSwarm: (campaignId: string, placementId: string) => void;
  tick: () => void;
  resetLab: () => void;
};

function defaultSwarm(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const c of CAMPAIGNS) {
    map[c.id] = PLACEMENTS.filter((p) => p.campaignId === c.id).map((p) => p.id);
  }
  return map;
}

function defaultActive(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of VARIANTS) {
    if (!map[v.placementId]) map[v.placementId] = v.id;
  }
  return map;
}

let sigSeq = 20;

export const useLab = create<State>((set, get) => ({
  placements: clonePlacements(),
  variants: VARIANTS,
  activeVariant: defaultActive(),
  swarm: defaultSwarm(),
  signals: seedSignals(),
  clock: 0,
  goLive: (id, destination) => {
    const p = get().placements.find((x) => x.id === id);
    if (!p || p.status === "live") return;
    const label = p.product;
    set((s) => ({
      placements: s.placements.map((x) =>
        x.id === id
          ? {
              ...x,
              status: "live" as const,
              destination,
              shippedAt: Date.now(),
              live: {
                impressions: 18,
                ctr: Math.max(0.8, x.lab.ctr * 0.62),
                dwell: x.lab.dwell * 0.7,
                proof: 1,
              },
            }
          : x,
      ),
      signals: [
        {
          id: `pkt-${++sigSeq}`,
          kind: "packet" as const,
          text: `Packet shipped · ${label} → ${destination}`,
          matchId: id,
          score: 1,
          at: Date.now(),
        },
        ...s.signals,
      ].slice(0, 24),
    }));
  },
  pullBack: (id) =>
    set((s) => ({
      placements: s.placements.map((x) =>
        x.id === id
          ? { ...x, status: "lab" as const, destination: null, shippedAt: null, live: null }
          : x,
      ),
    })),
  promoteVariant: (placementId, variantId) => {
    const v = get().variants.find((x) => x.id === variantId);
    if (!v) return;
    set((s) => ({
      activeVariant: { ...s.activeVariant, [placementId]: variantId },
      placements: s.placements.map((p) =>
        p.id === placementId
          ? {
              ...p,
              headline: v.headline,
              body: v.body,
              cta: v.cta,
              lab: { ...p.lab, ctr: v.labCtr },
            }
          : p,
      ),
    }));
  },
  toggleInSwarm: (campaignId, placementId) =>
    set((s) => {
      const cur = s.swarm[campaignId] ?? [];
      const next = cur.includes(placementId)
        ? cur.filter((x) => x !== placementId)
        : [...cur, placementId];
      return { swarm: { ...s.swarm, [campaignId]: next } };
    }),
  tick: () => {
    const pool = SIGNAL_POOL[Math.floor(Math.random() * SIGNAL_POOL.length)]!;
    const addSignal = get().clock % 4 === 3;
    set((s) => ({
      clock: s.clock + 1,
      placements: s.placements.map((p) => {
        if (p.status !== "live" || !p.live) {
          return {
            ...p,
            lab: {
              ...p.lab,
              impressions: p.lab.impressions + (p.format === "proof" ? 3 : 1),
            },
          };
        }
        return {
          ...p,
          live: {
            ...p.live,
            impressions: p.live.impressions + 7 + Math.floor(Math.random() * 11),
            ctr: Math.min(p.lab.ctr * 1.05, p.live.ctr + (Math.random() - 0.45) * 0.04),
            dwell: Math.max(2, p.live.dwell + (Math.random() - 0.5) * 0.08),
          },
        };
      }),
      signals: addSignal
        ? [
            {
              ...pool,
              id: `sig-${++sigSeq}`,
              at: Date.now(),
            },
            ...s.signals,
          ].slice(0, 24)
        : s.signals,
    }));
  },
  resetLab: () =>
    set({
      placements: clonePlacements(),
      activeVariant: defaultActive(),
      swarm: defaultSwarm(),
      signals: seedSignals(),
      clock: 0,
    }),
}));
