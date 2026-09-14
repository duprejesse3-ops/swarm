// A "session" here is a Playwright storageState blob — cookies plus
// localStorage entries captured from a real, already-logged-in browser (see
// scripts/capture-login-session.mjs, run once by hand). Loading it into a
// fresh browser context makes that context behave as if a human had just
// signed in — no OAuth app, no API key, no developer-portal application.
//
// That's also the whole risk surface: this is a live, full-access login
// session for a real account, not a scoped API token. Treat the env vars
// below with at least the same care as a password, because that's
// functionally what they are.

import type { BrowserContextOptions } from "playwright-core";

export type SessionName = "x" | "reddit";

/**
 * Reads and decodes the stored session for a channel. Returns null (never
 * throws for "not configured") so callers can log a clean skip instead of
 * crashing when a session hasn't been captured yet.
 */
export function loadSession(name: SessionName): BrowserContextOptions["storageState"] | null {
  const envVar = name === "x" ? "X_BROWSER_SESSION" : "REDDIT_BROWSER_SESSION";
  const raw = process.env[envVar];
  if (!raw) return null;
  try {
    // capture-login-session.mjs writes base64(JSON) specifically so the
    // value is a single safe line for a platform's env var UI — raw JSON
    // with embedded quotes/newlines is a common source of copy-paste
    // corruption in those text boxes.
    const json = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json) as BrowserContextOptions["storageState"];
  } catch {
    return null;
  }
}
