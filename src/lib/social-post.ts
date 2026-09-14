// Finds this week's official Reddit "Promote your business" thread — the
// read-only discovery step the actual posting agent depends on. See
// src/lib/browser-agent/ for how a post actually gets made now (a real
// browser session, driven like a human — no X/Reddit API keys); this file
// is only the "where is it safe to post" check that both the browser
// agent and (previously) an API-based poster shared.
//
// REDDIT_PROMO_THREAD in deploy.ts documents why this exists at all:
// several subs remove any product post from the main feed and ban the
// account for it — the only safe place is that week's official thread,
// and which thread that is changes every week. Posting without first
// confirming the current thread would just automate the ban.
//
// findRedditPromoThreadImpl() does what a human was doing by eye: search
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

/** Shared outcome shape for anything that actually posts — see src/lib/browser-agent/. */
export type PostResult = { ok: true; url: string } | { ok: false; error: string };
