// Launches a real Chromium instance the browser-agent drives like a human
// would — clicking the actual compose box, not calling an API. Two
// environments need two different Chromium binaries:
//
// - Local dev (npm run dev): playwright-core has no bundled browser of its
//   own (unlike the full `playwright` package, which IS a devDependency
//   here for scripts/browser-smoke.mjs — but that's a separate, larger
//   install not meant to ship to production). Local dev reuses whatever
//   Chromium `playwright install` put on this machine via the full
//   `playwright` package's own browser cache.
// - Vercel's serverless functions: no OS package manager, no pre-installed
//   browser, and a hard function-size ceiling that rules out bundling
//   Playwright's own ~300MB Chromium. @sparticuz/chromium ships a
//   Brotli-compressed build specifically sized and configured for
//   AWS-Lambda-style serverless (which is what Vercel's Node functions run
//   on), decompressed into /tmp at cold start.
//
// Known operational risk, called out rather than hidden: @sparticuz/chromium
// tracks Chromium's own release cadence, not Playwright's — a version
// mismatch between the two can surface as a launch or protocol-connection
// failure that only shows up once actually deployed. If the cron route
// starts failing with a launch error after a dependency bump, that
// mismatch is the first thing to check; re-pin @sparticuz/chromium to a
// build known to work with the installed playwright-core version.

import { chromium, type Browser } from "playwright-core";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export async function launchBrowser(): Promise<Browser> {
  if (isServerless) {
    const sparticuzChromium = (await import("@sparticuz/chromium")).default;
    return chromium.launch({
      args: sparticuzChromium.args,
      executablePath: await sparticuzChromium.executablePath(),
      headless: true,
    });
  }
  // Local dev: rely on the full `playwright` package's own installed
  // browser. Requires `npx playwright install chromium` once, same as
  // scripts/browser-smoke.mjs already needs.
  return chromium.launch({ headless: true });
}
