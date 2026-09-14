// The actual work the Vercel Cron hits src/routes/api/cron/auto-deploy.ts
// to do, factored out of the route file itself so it's testable without a
// real HTTP request — see server-routes SKILL.md's own "keep business
// logic in a service module, expose through the route" guidance.
//
// This is what makes posting genuinely unattended: it runs on a schedule,
// reading only from swarm_deploy_candidates (synced by whichever browser
// last had the app open — see deploy-queue.ts), needing no open tab and
// no client running at the moment it fires.

import type { Sql } from "./db";
import { X_POST_COOLDOWN_MS, REDDIT_POST_COOLDOWN_MS } from "./autodeploy";
import { redditComment, tweetText, DEFAULT_DESTINATIONS } from "./deploy";
import { findRedditPromoThreadImpl } from "./social-post";
import type { Organism } from "./types";

type CandidateRow = {
  id: string;
  sku: string;
  headline: string;
  body: string;
  proof_hook: string;
  landing_url: string;
};

/** Just enough of an Organism for tweetText/redditComment — see their signatures in deploy.ts. */
function toOrganismShape(row: CandidateRow): Organism {
  return {
    id: row.id,
    sku: row.sku,
    headline: row.headline,
    body: row.body,
    proofHook: row.proof_hook,
    landingUrl: row.landing_url,
  } as Organism;
}

export type ChannelOutcome =
  | { channel: "x" | "reddit"; result: "posted"; candidateId: string; url: string }
  | { channel: "x" | "reddit"; result: "skipped"; reason: string }
  | { channel: "x" | "reddit"; result: "failed"; candidateId: string; error: string };

async function lastPostedAt(sql: Sql, column: "posted_x_at" | "posted_reddit_at"): Promise<number> {
  const rows = await sql.query<{ last: string | null }>(
    `select max(${column}) as last from swarm_deploy_candidates`,
  );
  const last = rows[0]?.last;
  return last ? Date.parse(last) : 0;
}

async function runX(sql: Sql, postTweet: (text: string) => Promise<{ ok: boolean; url?: string; error?: string }>): Promise<ChannelOutcome> {
  const last = await lastPostedAt(sql, "posted_x_at");
  if (Date.now() - last < X_POST_COOLDOWN_MS) {
    return { channel: "x", result: "skipped", reason: "cooldown" };
  }
  const rows = await sql<CandidateRow>`
    select id, sku, headline, body, proof_hook, landing_url
    from swarm_deploy_candidates
    where posted_x_url is null
    order by fitness desc
    limit 1
  `;
  const candidate = rows[0];
  if (!candidate) return { channel: "x", result: "skipped", reason: "nothing eligible" };

  const text = tweetText(toOrganismShape(candidate));
  const posted = await postTweet(text);
  if (!posted.ok || !posted.url) {
    return { channel: "x", result: "failed", candidateId: candidate.id, error: posted.error ?? "unknown error" };
  }
  await sql`update swarm_deploy_candidates set posted_x_url = ${posted.url}, posted_x_at = now() where id = ${candidate.id}`;
  return { channel: "x", result: "posted", candidateId: candidate.id, url: posted.url };
}

async function runReddit(
  sql: Sql,
  postRedditComment: (opts: { permalink: string; body: string }) => Promise<{ ok: boolean; url?: string; error?: string }>,
  findThread: typeof findRedditPromoThreadImpl,
): Promise<ChannelOutcome> {
  const last = await lastPostedAt(sql, "posted_reddit_at");
  if (Date.now() - last < REDDIT_POST_COOLDOWN_MS) {
    return { channel: "reddit", result: "skipped", reason: "cooldown" };
  }
  const rows = await sql<CandidateRow>`
    select id, sku, headline, body, proof_hook, landing_url
    from swarm_deploy_candidates
    where posted_reddit_url is null
    order by fitness desc
    limit 1
  `;
  const candidate = rows[0];
  if (!candidate) return { channel: "reddit", result: "skipped", reason: "nothing eligible" };

  // Custom destinations aren't synced server-side yet — DEFAULT_DESTINATIONS
  // is the only sub this cron route can currently target. See deploy-queue.ts.
  const thread = await findThread(DEFAULT_DESTINATIONS.redditSub);
  if (!thread) return { channel: "reddit", result: "skipped", reason: "no confident promo-thread match this cycle" };

  const alreadyUsed = await sql<{ exists: boolean }>`
    select exists(select 1 from swarm_deploy_candidates where posted_reddit_thread_id = ${thread.threadId}) as exists
  `;
  if (alreadyUsed[0]?.exists) {
    return { channel: "reddit", result: "skipped", reason: "already commented in this thread" };
  }

  const body = redditComment(toOrganismShape(candidate), DEFAULT_DESTINATIONS);
  const posted = await postRedditComment({ permalink: thread.permalink, body });
  if (!posted.ok || !posted.url) {
    return { channel: "reddit", result: "failed", candidateId: candidate.id, error: posted.error ?? "unknown error" };
  }
  await sql`
    update swarm_deploy_candidates
    set posted_reddit_url = ${posted.url}, posted_reddit_at = now(), posted_reddit_thread_id = ${thread.threadId}
    where id = ${candidate.id}
  `;
  return { channel: "reddit", result: "posted", candidateId: candidate.id, url: posted.url };
}

/**
 * Runs both channels. Dependencies (postTweet/postRedditComment/findThread)
 * are injected with real defaults so a test can swap in fakes without
 * needing a live browser or a live Reddit search — see cron-deploy.test.ts.
 */
export async function runAutoDeployCron(deps?: {
  sql?: Sql;
  postTweet?: (text: string) => Promise<{ ok: boolean; url?: string; error?: string }>;
  postRedditComment?: (opts: { permalink: string; body: string }) => Promise<{ ok: boolean; url?: string; error?: string }>;
  findThread?: typeof findRedditPromoThreadImpl;
}): Promise<{ x: ChannelOutcome; reddit: ChannelOutcome }> {
  const sql =
    deps?.sql ??
    (await (async () => {
      const { getSql } = await import("./db");
      return getSql();
    })());
  const postTweet =
    deps?.postTweet ??
    (async (text: string) => {
      const { postTweetViaBrowser } = await import("./browser-agent/post-x");
      return postTweetViaBrowser(text);
    });
  const postRedditComment =
    deps?.postRedditComment ??
    (async (opts: { permalink: string; body: string }) => {
      const { postRedditCommentViaBrowser } = await import("./browser-agent/post-reddit");
      return postRedditCommentViaBrowser(opts);
    });
  const findThread = deps?.findThread ?? findRedditPromoThreadImpl;

  const [x, reddit] = await Promise.all([runX(sql, postTweet), runReddit(sql, postRedditComment, findThread)]);
  return { x, reddit };
}
