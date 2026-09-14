// Which organism (if any) autopilot should actually post right now, and to
// which channel. Kept separate from store.ts so the picking logic is
// testable without a zustand store, and separate from social-post.ts so
// "who's next" and "how do we actually post" don't get tangled together.

import type { Organism, Swarm } from "./types";

// Real cooldowns, not the ~1800ms/18000ms demo-pacing constants autoStep
// uses elsewhere for hijack/evolve. Those only govern how fast the local
// simulation plays out; these govern how often a real account actually
// posts something live, so they default to values that don't read as spam
// or trip a platform's rate limits. Exported so a deployment can tune them
// via env without touching this logic.
export const X_POST_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes between auto-tweets
export const REDDIT_POST_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours between auto-comments

/**
 * The best not-yet-posted-to-this-channel organism belonging to a
 * currently-running swarm, or null if the channel is on cooldown or
 * nothing qualifies. "Qualifies" means champion or live — never a plain
 * "alive" organism that hasn't proven itself yet, and never one already
 * killed. Champion-or-live is deliberately broader than "live only": an
 * organism can be posted to X and still be waiting on its Reddit post
 * (each channel has its own cooldown and its own success/failure path).
 */
export function pickDeployCandidate(
  organisms: Organism[],
  swarms: Swarm[],
  channel: "x" | "reddit",
  now: number,
  lastPostAt: number,
): Organism | null {
  const cooldown = channel === "x" ? X_POST_COOLDOWN_MS : REDDIT_POST_COOLDOWN_MS;
  if (now - lastPostAt < cooldown) return null;

  const runningSwarmIds = new Set(swarms.filter((sw) => sw.running).map((sw) => sw.id));
  const eligible = organisms.filter(
    (o) =>
      runningSwarmIds.has(o.swarmId) &&
      (o.status === "champion" || o.status === "live") &&
      !o.deployed?.[channel],
  );
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => b.fitness - a.fitness);
  return eligible[0]!;
}
