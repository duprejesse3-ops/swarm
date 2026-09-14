import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickDeployCandidate, X_POST_COOLDOWN_MS, REDDIT_POST_COOLDOWN_MS } from "./autodeploy.ts";
import type { Organism, Swarm } from "./types.ts";

function organism(overrides: Partial<Organism> = {}): Organism {
  return {
    id: "org_1",
    swarmId: "swarm_1",
    sku: "AI-AB-002",
    channel: "conversation",
    generation: 1,
    parentIds: [],
    headline: "h",
    body: "b",
    proofHook: "p",
    cta: "c",
    landingUrl: "https://multinicheai.com/product/AI-AB-002",
    targetIntent: "intent",
    status: "champion",
    fitness: 10,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
    createdAt: 0,
    ...overrides,
  };
}

function swarm(overrides: Partial<Swarm> = {}): Swarm {
  return {
    id: "swarm_1",
    name: "s",
    generation: 1,
    dailyBudget: 36,
    running: true,
    startedAt: 0,
    simulatedHours: 0,
    ...overrides,
  };
}

describe("pickDeployCandidate", () => {
  it("returns null when the channel is on cooldown", () => {
    const now = 1_000_000;
    const lastPostAt = now - 1000; // just posted, nowhere near X_POST_COOLDOWN_MS
    const result = pickDeployCandidate([organism()], [swarm()], "x", now, lastPostAt);
    assert.equal(result, null);
  });

  it("returns a candidate once cooldown has elapsed", () => {
    const now = 1_000_000;
    const lastPostAt = now - X_POST_COOLDOWN_MS - 1;
    const result = pickDeployCandidate([organism()], [swarm()], "x", now, lastPostAt);
    assert.ok(result);
    assert.equal(result!.id, "org_1");
  });

  it("ignores organisms belonging to a paused (non-running) swarm", () => {
    const now = 1_000_000;
    const result = pickDeployCandidate(
      [organism()],
      [swarm({ running: false })],
      "x",
      now,
      -Infinity,
    );
    assert.equal(result, null);
  });

  it("ignores organisms that are killed or merely 'alive', not champion/live", () => {
    const now = 1_000_000;
    const killed = organism({ id: "k", status: "killed" });
    const alive = organism({ id: "a", status: "alive" });
    const result = pickDeployCandidate([killed, alive], [swarm()], "x", now, -Infinity);
    assert.equal(result, null);
  });

  it("skips an organism already deployed to that channel, even if it's the fittest", () => {
    const now = 1_000_000;
    const alreadyPosted = organism({ id: "posted", fitness: 99, deployed: { x: { url: "u", at: 0 } } });
    const notYet = organism({ id: "fresh", fitness: 5 });
    const result = pickDeployCandidate([alreadyPosted, notYet], [swarm()], "x", now, -Infinity);
    assert.equal(result!.id, "fresh");
  });

  it("an organism already posted to X can still be picked for reddit", () => {
    const now = 1_000_000;
    const org = organism({ deployed: { x: { url: "u", at: 0 } } });
    const result = pickDeployCandidate([org], [swarm()], "reddit", now, -Infinity);
    assert.equal(result!.id, "org_1");
  });

  it("picks the fittest eligible organism across multiple running swarms", () => {
    const now = 1_000_000;
    const swarms = [swarm({ id: "s1" }), swarm({ id: "s2" })];
    const weak = organism({ id: "weak", swarmId: "s1", fitness: 3 });
    const strong = organism({ id: "strong", swarmId: "s2", fitness: 20 });
    const result = pickDeployCandidate([weak, strong], swarms, "x", now, -Infinity);
    assert.equal(result!.id, "strong");
  });

  it("reddit's cooldown is independent of, and longer than, X's", () => {
    assert.ok(REDDIT_POST_COOLDOWN_MS > X_POST_COOLDOWN_MS);
    const now = 1_000_000;
    const lastPostAt = now - X_POST_COOLDOWN_MS - 1; // past X's cooldown, not reddit's
    const result = pickDeployCandidate([organism()], [swarm()], "reddit", now, lastPostAt);
    assert.equal(result, null);
  });
});
