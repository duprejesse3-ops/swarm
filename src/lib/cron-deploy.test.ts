// Tests against a REAL PGlite instance (not a mock DB) with the actual
// migration applied — same standard as social-post.test.ts's fake-fetch
// approach: exercise real behavior wherever it's feasible without a live
// network dependency. Only postTweet/postRedditComment/findThread are
// injected fakes, since those need a live browser or a live Reddit search.
//
// Every test here injects its own real PGlite-backed sql client, so
// cron-deploy.ts's own @/lib/db import (lazy — see the comment there)
// never actually runs.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { runAutoDeployCron } from "./cron-deploy.ts";
import type { Sql } from "./db.ts";

/** Wraps a raw PGlite instance in the same tagged-template + .query() surface db.ts's real Sql uses. */
function wrapPglite(pg: PGlite): Sql {
  const run = async <T>(text: string, params: unknown[]): Promise<T[]> => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  };
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) => run<T>(text, params);
  return sql;
}

async function freshDb(): Promise<Sql> {
  const pg = new PGlite();
  await pg.waitReady;
  const migration = readFileSync(new URL("../../migrations/0001_swarm_deploy_candidates.sql", import.meta.url), "utf8");
  await pg.exec(migration);
  return wrapPglite(pg);
}

async function insertCandidate(
  sql: Sql,
  overrides: Partial<{
    id: string;
    swarm_id: string;
    sku: string;
    headline: string;
    body: string;
    proof_hook: string;
    landing_url: string;
    fitness: number;
    status: string;
  }> = {},
) {
  const c = {
    id: "org1",
    swarm_id: "swarm1",
    sku: "AI-AB-002",
    headline: "h",
    body: "b",
    proof_hook: "p",
    landing_url: "https://multinicheai.com/product/AI-AB-002",
    fitness: 10,
    status: "champion",
    ...overrides,
  };
  await sql`
    insert into swarm_deploy_candidates (id, swarm_id, sku, headline, body, proof_hook, landing_url, fitness, status)
    values (${c.id}, ${c.swarm_id}, ${c.sku}, ${c.headline}, ${c.body}, ${c.proof_hook}, ${c.landing_url}, ${c.fitness}, ${c.status})
  `;
}

describe("runAutoDeployCron", () => {
  it("skips both channels when the queue is empty", async () => {
    const sql = await freshDb();
    const result = await runAutoDeployCron({
      sql,
      postTweet: async () => {
        throw new Error("must not be called");
      },
      postRedditComment: async () => {
        throw new Error("must not be called");
      },
      findThread: async () => {
        throw new Error("must not be called");
      },
    });
    assert.equal(result.x.result, "skipped");
    assert.equal(result.reddit.result, "skipped");
  });

  it("posts the fittest unposted candidate to X and records the URL", async () => {
    const sql = await freshDb();
    await insertCandidate(sql, { id: "weak", fitness: 3 });
    await insertCandidate(sql, { id: "strong", fitness: 20 });

    let postedText = "";
    const result = await runAutoDeployCron({
      sql,
      postTweet: async (text) => {
        postedText = text;
        return { ok: true, url: "https://x.com/i/status/123" };
      },
      postRedditComment: async () => ({ ok: false, error: "not used in this test" }),
      findThread: async () => null,
    });

    assert.equal(result.x.result, "posted");
    if (result.x.result === "posted") {
      assert.equal(result.x.candidateId, "strong");
      assert.equal(result.x.url, "https://x.com/i/status/123");
    }
    assert.ok(postedText.length > 0);

    const rows = await sql<{ posted_x_url: string | null }>`select posted_x_url from swarm_deploy_candidates where id = ${"strong"}`;
    assert.equal(rows[0]?.posted_x_url, "https://x.com/i/status/123");
  });

  it("respects the X cooldown — does not post again right after a successful post", async () => {
    const sql = await freshDb();
    await insertCandidate(sql, { id: "a", fitness: 5 });
    await insertCandidate(sql, { id: "b", fitness: 6 });

    // First run posts "b" (higher fitness).
    await runAutoDeployCron({
      sql,
      postTweet: async () => ({ ok: true, url: "https://x.com/i/status/1" }),
      postRedditComment: async () => ({ ok: false, error: "n/a" }),
      findThread: async () => null,
    });

    // Second run, immediately after — cooldown should block a second post
    // even though "a" is still eligible.
    let secondCallMade = false;
    const second = await runAutoDeployCron({
      sql,
      postTweet: async () => {
        secondCallMade = true;
        return { ok: true, url: "https://x.com/i/status/2" };
      },
      postRedditComment: async () => ({ ok: false, error: "n/a" }),
      findThread: async () => null,
    });

    assert.equal(second.x.result, "skipped");
    assert.equal(secondCallMade, false, "cooldown must prevent a second real post attempt");
  });

  it("does not mark a candidate posted when the browser-agent call fails", async () => {
    const sql = await freshDb();
    await insertCandidate(sql, { id: "org1" });

    const result = await runAutoDeployCron({
      sql,
      postTweet: async () => ({ ok: false, error: "compose box never appeared" }),
      postRedditComment: async () => ({ ok: false, error: "n/a" }),
      findThread: async () => null,
    });

    assert.equal(result.x.result, "failed");
    const rows = await sql<{ posted_x_url: string | null }>`select posted_x_url from swarm_deploy_candidates where id = ${"org1"}`;
    assert.equal(rows[0]?.posted_x_url, null);
  });

  it("skips Reddit entirely when no confident promo-thread match is found — never guesses", async () => {
    const sql = await freshDb();
    await insertCandidate(sql, { id: "org1" });

    let redditPostCalled = false;
    const result = await runAutoDeployCron({
      sql,
      postTweet: async () => ({ ok: false, error: "n/a" }),
      postRedditComment: async () => {
        redditPostCalled = true;
        return { ok: true, url: "should not happen" };
      },
      findThread: async () => null,
    });

    assert.equal(result.reddit.result, "skipped");
    assert.equal(redditPostCalled, false);
  });

  it("posts a Reddit comment into a found thread and records the thread id", async () => {
    const sql = await freshDb();
    await insertCandidate(sql, { id: "org1" });

    const result = await runAutoDeployCron({
      sql,
      postTweet: async () => ({ ok: false, error: "n/a" }),
      postRedditComment: async () => ({ ok: true, url: "https://www.reddit.com/r/smallbusiness/comments/abc/x/" }),
      findThread: async () => ({
        threadId: "abc123",
        title: "Promote your business",
        permalink: "/r/smallbusiness/comments/abc123/promote/",
        createdAt: Date.now(),
        stickied: true,
      }),
    });

    assert.equal(result.reddit.result, "posted");
    const rows = await sql<{ posted_reddit_thread_id: string | null }>`
      select posted_reddit_thread_id from swarm_deploy_candidates where id = ${"org1"}
    `;
    assert.equal(rows[0]?.posted_reddit_thread_id, "abc123");
  });

  it("never comments twice into the same thread across different candidates", async () => {
    const sql = await freshDb();
    await insertCandidate(sql, { id: "first", fitness: 20 });
    await insertCandidate(sql, { id: "second", fitness: 10 });

    // "first" gets posted into thread abc123.
    await runAutoDeployCron({
      sql,
      postTweet: async () => ({ ok: false, error: "n/a" }),
      postRedditComment: async () => ({ ok: true, url: "https://www.reddit.com/r/smallbusiness/comments/abc/x/" }),
      findThread: async () => ({
        threadId: "abc123",
        title: "Promote your business",
        permalink: "/r/smallbusiness/comments/abc123/promote/",
        createdAt: Date.now(),
        stickied: true,
      }),
    });

    // Force the reddit cooldown open (isolating what this test actually
    // checks — thread dedup, not the cooldown covered above) and confirm
    // the second run still refuses to comment again into the same thread.
    await sql`update swarm_deploy_candidates set posted_reddit_at = null where id = ${"first"}`;

    let secondPostCalled = false;
    const result = await runAutoDeployCron({
      sql,
      postTweet: async () => ({ ok: false, error: "n/a" }),
      postRedditComment: async () => {
        secondPostCalled = true;
        return { ok: true, url: "should not happen" };
      },
      findThread: async () => ({
        threadId: "abc123", // same thread as before
        title: "Promote your business",
        permalink: "/r/smallbusiness/comments/abc123/promote/",
        createdAt: Date.now(),
        stickied: true,
      }),
    });

    assert.equal(result.reddit.result, "skipped");
    assert.equal(secondPostCalled, false, "must not comment twice into a thread already used");
  });
});
