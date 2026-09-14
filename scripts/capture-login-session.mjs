#!/usr/bin/env node
// Run this once, by hand, on your own machine — never in CI, never
// server-side. It opens a real, visible browser, lets you log in to X and
// Reddit exactly as you normally would, then saves the resulting session
// (cookies + storage) as the two env vars autoDeploy's browser-agent
// needs: X_BROWSER_SESSION and REDDIT_BROWSER_SESSION.
//
// This is the alternative to an API key: instead of registering a
// developer app and generating scoped tokens, you're capturing a real
// login session and handing the app the same access a signed-in browser
// tab has. That is real account access, not a scoped permission — store
// the output with the same care as a password, and treat rotating it
// (log out everywhere, run this again) the same way you'd rotate a
// leaked credential.
//
// Usage:
//   node scripts/capture-login-session.mjs x
//   node scripts/capture-login-session.mjs reddit
//
// Requires the full `playwright` package's browser binaries:
//   npx playwright install chromium

import { chromium } from "playwright";

const SITES = {
  x: { url: "https://x.com/login", envVar: "X_BROWSER_SESSION" },
  reddit: { url: "https://www.reddit.com/login", envVar: "REDDIT_BROWSER_SESSION" },
};

const target = process.argv[2];
if (!target || !SITES[target]) {
  console.error(`Usage: node scripts/capture-login-session.mjs <${Object.keys(SITES).join("|")}>`);
  process.exit(1);
}

const site = SITES[target];

console.log(`Opening a browser to ${site.url} — log in by hand, exactly as you normally would.`);
console.log("Once you're fully logged in and see your normal feed/home page, come back here and press Enter.");

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(site.url);

await new Promise((resolve) => {
  process.stdin.resume();
  process.stdin.once("data", resolve);
});

const state = await context.storageState();
await browser.close();

const encoded = Buffer.from(JSON.stringify(state)).toString("base64");

console.log("\nLogged in. Set this as an env var in your deployment:\n");
console.log(`${site.envVar}=${encoded}`);
console.log(
  `\n(${encoded.length} characters — some platforms' env-var UIs have a size limit; if this gets rejected, that limit is the likely reason.)`,
);
