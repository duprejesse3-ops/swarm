// Turns "post" from a human clicking a pre-filled compose window into an
// actual API call — but only where it's safe to do so unattended.
//
// X (Twitter) posting is a plain API call: there's nothing to get wrong
// about *where* a tweet lands. Reddit is different. REDDIT_PROMO_THREAD in
// deploy.ts already documents why: several subs remove any product post
// from the main feed and ban the account for it — the only safe place is
// that week's official "Promote your business" thread, and which thread
// that is changes every week. The old flow handed a human a search link and
// trusted them to find the right thread and not post to the wrong place.
// Automating that without replacing the human's judgment with something
// real would just automate the ban.
//
// So findRedditPromoThread() does what the human was doing by eye: search
// the sub, and only report a match if it's confident — a recent, stickied,
// or clearly-titled promo thread. No confident match means no post. This
// module would rather stay silent for a week than guess wrong.

import { createServerFn } from "@tanstack/react-start";
import { redditPolicy, stripSub } from "./deploy";

export type PromoThreadMatch = {
  threadId: string; // Reddit "t3_" fullname without the prefix
  title: string;
  permalink: string;
  createdAt: number; // epoch ms
  stickied: boolean;
};

type RedditListingChild = {
  data: {
    id: string;
    title: string;
    permalink: string;
    created_utc: number;
    stickied: boolean;
    author: string;
    num_comments: number;
  };
};

type RedditListing = {
  data: { children: RedditListingChild[] };
};

// A promo thread is expected roughly weekly. Anything older than this is
// very likely last cycle's thread (or older), already past its usefulness
// and possibly locked — treat it as no match rather than post into a stale
// thread.
const MAX_THREAD_AGE_MS = 9 * 24 * 60 * 60 * 1000; // 9 days — a week plus slack

/**
 * Pure matching logic, separated from the network call so it's testable
 * with fixture data instead of hitting Reddit. Picks the best candidate
 * from a set of search results, or null if nothing is a confident match.
 */
export function pickPromoThread(
  children: RedditListingChild[],
  now: number,
): PromoThreadMatch | null {
  const candidates = children
    .map((c) => c.data)
    .filter((d) => now - d.created_utc * 1000 <= MAX_THREAD_AGE_MS)
    .filter((d) => /promot/i.test(d.title)); // "Promote your business/startup/etc"

  if (candidates.length === 0) return null;

  // Prefer stickied (mods pin the current cycle's thread), then most recent.
  candidates.sort((a, b) => {
    if (a.stickied !== b.stickied) return a.stickied ? -1 : 1;
    return b.created_utc - a.created_utc;
  });

  const best = candidates[0]!;
  return {
    threadId: best.id,
    title: best.title,
    permalink: best.permalink,
    createdAt: best.created_utc * 1000,
    stickied: best.stickied,
  };
}

/**
 * Looks up this week's promo thread for a sub with a known no-feed-posts
 * policy. Returns null (never throws for "didn't find one") when nothing
 * confident turns up — the caller must treat null as "do not post".
 *
 * Read-only Reddit search needs no auth, just a real User-Agent (Reddit
 * throttles/blocks the default fetch UA). Kept as a plain function
 * (findRedditPromoThreadImpl) for the same testability reason as the
 * postX/postReddit split below — findRedditPromoThread is the thin
 * createServerFn wrapper real callers use.
 */
export async function findRedditPromoThreadImpl(
  sub: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PromoThreadMatch | null> {
  const clean = stripSub(sub);
  const policy = redditPolicy(clean);
  if (!policy) return null; // no known feed-ban policy for this sub — caller should submit directly instead

  const url = `https://www.reddit.com/r/${encodeURIComponent(clean)}/search.json?q=promote%20your%20business&restrict_sr=1&sort=new&t=month&limit=10`;
  const res = await fetchImpl(url, {
    headers: { "User-Agent": "multinicheai-swarm/1.0 (by /u/MultiNicheAI81)" },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as RedditListing;
  return pickPromoThread(body.data.children, Date.now());
}

/**
 * Server-fn wrapper. This matters here more than for the posters below:
 * Reddit does not send permissive CORS headers, so calling the plain impl's
 * fetch() directly from a browser would just fail — routing it through the
 * server (where CORS doesn't apply) is not optional the way it is for a
 * same-origin call.
 */
export const findRedditPromoThread = createServerFn({ method: "POST" })
  .validator((input: { sub: string }) => input)
  .handler(async ({ data }) => findRedditPromoThreadImpl(data.sub));

type RedditCredentials = {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
};

function redditCredentials(): RedditCredentials | null {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;
  if (!clientId || !clientSecret || !username || !password) return null;
  return { clientId, clientSecret, username, password };
}

async function redditAccessToken(creds: RedditCredentials, fetchImpl: typeof fetch): Promise<string> {
  const res = await fetchImpl("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "multinicheai-swarm/1.0 (by /u/MultiNicheAI81)",
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: creds.username,
      password: creds.password,
    }),
  });
  if (!res.ok) throw new Error(`Reddit auth failed: ${res.status}`);
  const body = (await res.json()) as { access_token?: string; error?: string };
  if (!body.access_token) throw new Error(`Reddit auth failed: ${body.error ?? "no access_token in response"}`);
  return body.access_token;
}

export type PostResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * The actual comment-posting logic, kept as a plain async function (not
 * wrapped in createServerFn) so it's callable directly from tests — a
 * createServerFn-wrapped export can only run inside the TanStack Start
 * server runtime and throws outside it. postRedditComment below is the
 * thin server-fn wrapper real callers use; this is what it calls.
 */
export async function postRedditCommentImpl(
  data: { threadId: string; permalink: string; body: string },
  fetchImpl: typeof fetch = fetch,
): Promise<PostResult> {
  const creds = redditCredentials();
  if (!creds) return { ok: false, error: "Reddit credentials are not configured in this environment" };
  try {
    const token = await redditAccessToken(creds, fetchImpl);
    const res = await fetchImpl("https://oauth.reddit.com/api/comment", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "multinicheai-swarm/1.0 (by /u/MultiNicheAI81)",
      },
      body: new URLSearchParams({ thing_id: `t3_${data.threadId}`, text: data.body, api_type: "json" }),
    });
    if (!res.ok) return { ok: false, error: `Reddit comment failed: ${res.status}` };
    const result = (await res.json()) as {
      json?: { errors?: [string, string][]; data?: { things?: { data?: { permalink?: string } }[] } };
    };
    const errors = result.json?.errors;
    if (errors && errors.length > 0) return { ok: false, error: errors.map((e) => e.join(": ")).join("; ") };
    const permalink = result.json?.data?.things?.[0]?.data?.permalink;
    return { ok: true, url: permalink ? `https://www.reddit.com${permalink}` : `https://www.reddit.com${data.permalink}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Reddit comment failed" };
  }
}

/**
 * Posts a comment into a specific, already-identified thread. Never
 * searches for the thread itself — that's findRedditPromoThread's job,
 * kept separate so a caller can't accidentally skip the confidence check.
 */
export const postRedditComment = createServerFn({ method: "POST" })
  .validator((input: { threadId: string; permalink: string; body: string }) => input)
  .handler(async ({ data }) => postRedditCommentImpl(data));

function xCredentials() {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) return null;
  return { apiKey, apiSecret, accessToken, accessSecret };
}

/**
 * The actual tweet-posting logic, kept plain (not createServerFn-wrapped)
 * for the same testability reason as postRedditCommentImpl above.
 */
export async function postTweetImpl(data: { text: string }): Promise<PostResult> {
  const creds = xCredentials();
  if (!creds) return { ok: false, error: "X credentials are not configured in this environment" };
  try {
    const { TwitterApi } = await import("twitter-api-v2");
    const client = new TwitterApi({
      appKey: creds.apiKey,
      appSecret: creds.apiSecret,
      accessToken: creds.accessToken,
      accessSecret: creds.accessSecret,
    });
    const result = await client.v2.tweet(data.text);
    return { ok: true, url: `https://x.com/i/status/${result.data.id}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "X post failed" };
  }
}

/**
 * Posts a real tweet via X API v2, OAuth 1.0a user context (the "write as
 * this specific account" auth mode — an app-only bearer token cannot
 * post). Uses twitter-api-v2 rather than hand-rolled OAuth 1.0a signing:
 * that signing scheme has enough sharp edges that a hand-rolled version is
 * a worse bet than a maintained library for something that posts live to a
 * real account.
 */
export const postTweet = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => input)
  .handler(async ({ data }) => postTweetImpl(data));
