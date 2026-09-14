// Drives a real, logged-in browser through x.com's own compose UI — the
// same clicks a human makes, not an API call. This is the piece most
// likely to need a live fix: X's DOM changes on its own schedule, and
// there's no way to verify selectors against the live site from here. If
// this starts failing, the first move is opening x.com/compose/post by
// hand and checking whether these data-testid values still exist.

import { launchBrowser } from "./launch";
import { loadSession } from "./session";
import type { PostResult } from "../social-post";

const COMPOSE_URL = "https://x.com/compose/post";
const TEXTAREA_SELECTOR = '[data-testid="tweetTextarea_0"]';
const POST_BUTTON_SELECTOR = '[data-testid="tweetButton"]';
// X's compose call is a GraphQL mutation named CreateTweet — sniffing its
// response is how we get the real tweet id/URL without guessing at
// redirect behavior, which has changed more than once.
const CREATE_TWEET_URL_FRAGMENT = "CreateTweet";

export async function postTweetViaBrowser(text: string): Promise<PostResult> {
  const session = loadSession("x");
  if (!session) return { ok: false, error: "No X browser session captured — run scripts/capture-login-session.mjs" };

  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ storageState: session });
    const page = await context.newPage();

    const responsePromise = page
      .waitForResponse((res) => res.url().includes(CREATE_TWEET_URL_FRAGMENT) && res.request().method() === "POST", {
        timeout: 20_000,
      })
      .catch(() => null);

    await page.goto(COMPOSE_URL, { waitUntil: "domcontentloaded" });
    const textarea = page.locator(TEXTAREA_SELECTOR).first();
    await textarea.waitFor({ state: "visible", timeout: 15_000 });
    await textarea.click();
    await textarea.fill(text);

    const postButton = page.locator(POST_BUTTON_SELECTOR).first();
    await postButton.waitFor({ state: "visible", timeout: 10_000 });
    if (await postButton.isDisabled()) {
      return { ok: false, error: "X post button stayed disabled after filling the compose box" };
    }
    await postButton.click();

    const response = await responsePromise;
    if (!response) {
      return { ok: false, error: "Clicked Post but never saw X's CreateTweet response — likely posted; URL unconfirmed" };
    }
    const body = (await response.json().catch(() => null)) as
      | { data?: { create_tweet?: { tweet_results?: { result?: { rest_id?: string } } } } }
      | null;
    const tweetId = body?.data?.create_tweet?.tweet_results?.result?.rest_id;
    if (!tweetId) {
      return { ok: false, error: "X accepted the post but its response didn't contain a tweet id" };
    }
    return { ok: true, url: `https://x.com/i/status/${tweetId}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "X browser-post failed" };
  } finally {
    await browser.close();
  }
}
