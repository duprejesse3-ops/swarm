import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickPromoThread, findRedditPromoThreadImpl } from "./social-post.ts";

function listingChild(overrides: Partial<{
  id: string;
  title: string;
  permalink: string;
  created_utc: number;
  stickied: boolean;
  author: string;
  num_comments: number;
}> = {}) {
  return {
    data: {
      id: "abc123",
      title: "Promote your business — weekly thread",
      permalink: "/r/smallbusiness/comments/abc123/promote_your_business/",
      created_utc: Math.floor(Date.now() / 1000),
      stickied: true,
      author: "AutoModerator",
      num_comments: 12,
      ...overrides,
    },
  };
}

describe("pickPromoThread", () => {
  const now = Date.now();

  it("returns null with no candidates", () => {
    assert.equal(pickPromoThread([], now), null);
  });

  it("ignores results that don't look like a promo thread by title", () => {
    const children = [listingChild({ title: "Anyone tried this AI tool?", stickied: false })];
    assert.equal(pickPromoThread(children, now), null);
  });

  it("ignores a promo-titled thread that's too old to be this cycle's", () => {
    const tooOld = now / 1000 - 20 * 24 * 60 * 60; // 20 days old
    const children = [listingChild({ created_utc: tooOld })];
    assert.equal(pickPromoThread(children, now), null);
  });

  it("picks a recent, promo-titled thread", () => {
    const children = [listingChild()];
    const match = pickPromoThread(children, now);
    assert.ok(match);
    assert.equal(match!.threadId, "abc123");
  });

  it("prefers a stickied thread over a more recent non-stickied one", () => {
    const stickied = listingChild({ id: "sticky1", stickied: true, created_utc: now / 1000 - 5 * 86400 });
    const fresher = listingChild({ id: "fresh1", stickied: false, created_utc: now / 1000 - 1 * 86400 });
    const match = pickPromoThread([fresher, stickied], now);
    assert.equal(match!.threadId, "sticky1");
  });

  it("among non-stickied candidates, prefers the most recent", () => {
    const older = listingChild({ id: "old1", stickied: false, created_utc: now / 1000 - 5 * 86400 });
    const newer = listingChild({ id: "new1", stickied: false, created_utc: now / 1000 - 1 * 86400 });
    const match = pickPromoThread([older, newer], now);
    assert.equal(match!.threadId, "new1");
  });
});

describe("findRedditPromoThreadImpl", () => {
  it("returns null for a sub with no known feed-ban policy — nothing to search for", async () => {
    const result = await findRedditPromoThreadImpl("someRandomSubWithNoPolicy");
    assert.equal(result, null);
  });

  it("returns null when Reddit's search request fails", async () => {
    const fakeFetch = (async () => new Response("", { status: 503 })) as unknown as typeof fetch;
    const result = await findRedditPromoThreadImpl("smallbusiness", fakeFetch);
    assert.equal(result, null);
  });

  it("returns the matched thread from a real-shaped search response", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ data: { children: [listingChild()] } }), { status: 200 })) as unknown as typeof fetch;
    const result = await findRedditPromoThreadImpl("smallbusiness", fakeFetch);
    assert.ok(result);
    assert.equal(result!.threadId, "abc123");
  });
});
