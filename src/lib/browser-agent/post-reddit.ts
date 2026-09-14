// Drives a real, logged-in browser to leave a comment in an already-
// identified promo thread. Discovery (which thread) still goes through
// findRedditPromoThreadImpl's read-only fetch — that part doesn't change,
// it needs no login and no browser. Only the actual posting step becomes
// browser automation instead of the Reddit API.
//
// This file is the least verifiable part of the whole browser-agent: new
// reddit.com is built from custom elements (<shreddit-composer> and
// friends) whose internals are considerably less stable and less
// documented than X's data-testid attributes, and there is no way to
// confirm these selectors against the live site from here. Treat a
// failure here as expected-until-proven-otherwise, not a sign something
// else is broken — the first fix is opening the actual promo thread by
// hand and inspecting the real comment box markup.

import { launchBrowser } from "./launch";
import { loadSession } from "./session";
import type { PostResult } from "../social-post";

// Waits for a locator to become visible, returning false on timeout
// instead of throwing — locator.isVisible()'s own `timeout` option is
// deprecated and ignored (it never waits), so a naive isVisible({timeout})
// check here would fire before the page finished rendering and always
// report "not found." This is what actually waits.
async function becomesVisible(locator: import("playwright-core").Locator, timeoutMs: number): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

export async function postRedditCommentViaBrowser(opts: {
  permalink: string;
  body: string;
}): Promise<PostResult> {
  const session = loadSession("reddit");
  if (!session) {
    return { ok: false, error: "No Reddit browser session captured — run scripts/capture-login-session.mjs" };
  }

  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ storageState: session });
    const page = await context.newPage();
    await page.goto(`https://www.reddit.com${opts.permalink}`, { waitUntil: "domcontentloaded" });

    // Layered because new-reddit's comment box markup isn't one stable
    // selector across sub types and experiment cohorts — try the common
    // shapes in order, use whichever actually shows up.
    const candidateSelectors = [
      'shreddit-composer [contenteditable="true"]',
      '[data-testid="comment-submission-form-richtext"] [contenteditable="true"]',
      'div[role="textbox"][contenteditable="true"]',
    ];
    let editor = null;
    for (const selector of candidateSelectors) {
      const locator = page.locator(selector).first();
      if (await becomesVisible(locator, 5_000)) {
        editor = locator;
        break;
      }
    }
    if (!editor) {
      return { ok: false, error: "Could not find Reddit's comment box — its markup has likely changed" };
    }

    await editor.click();
    await editor.fill(opts.body).catch(async () => {
      // Some rich-text editors reject .fill() (it doesn't dispatch the
      // input events they listen for) — type as a fallback.
      await editor!.pressSequentially(opts.body, { delay: 5 });
    });

    const submitButton = page.getByRole("button", { name: /^comment$/i }).first();
    if (!(await becomesVisible(submitButton, 5_000))) {
      return { ok: false, error: "Filled the comment box but found no visible Comment/submit button" };
    }
    if (await submitButton.isDisabled()) {
      return { ok: false, error: "Comment button stayed disabled after filling the box" };
    }
    await submitButton.click();

    // Reddit doesn't hand back a clean permalink synchronously the way
    // X's response does — wait briefly for the new comment to render, then
    // report the thread permalink itself rather than guess at a specific
    // comment fragment URL that may not exist yet.
    await page.waitForTimeout(3_000);
    return { ok: true, url: `https://www.reddit.com${opts.permalink}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Reddit browser-post failed" };
  } finally {
    await browser.close();
  }
}
