# SWARM

Intent-hijack ad organism for [MULTINICHE AI](https://multinicheai.com).

Most ads try to create demand. SWARM hijacks demand that already exists: it maps live pain-utterances to a SKU, spawns proof-first micro-ads (search intercept, conversation native, proof-loop spec sheets, shadow listings), then evolves winners and kills losers.

**Autopilot is on by default.** Open the app and it hijacks intent, runs swarms, and evolves ripe generations with no click. Grok copy is only used when you turn that switch on for a manual spawn — autopilot never spends API quota.

Live source: [github.com/duprejesse3-ops/Jblessd](https://github.com/duprejesse3-ops/Jblessd) (`swarm/` + `swarm.html`)

The operator that stays up: [multinicheai.com/swarm](https://multinicheai.com/swarm)

## Host it yourself (does not depend on Grok)

The Grok preview at grok-sandbox.com sleeps. Cloudflare 521 means that tunnel died — not SWARM.

1. Open [multinicheai.com/swarm](https://multinicheai.com/swarm) — it ships from the Jblessd Netlify site.
2. Chrome → Install app. That home-screen icon does not depend on Grok.
3. Install the PWA from **that** URL in Chrome. That home-screen app stays up.

Build command is `npm run build`. Optional env: `XAI_API_KEY` (Scan live X / Grok copy). Without it, autopilot still runs on the local genome.

## Autonomous posting (a real browser agent, not an API, not a click)

By default, "post" opens a pre-filled compose window and waits for a human
to press send. Setting this up switches posting over to a scheduled,
server-side agent that drives a real logged-in browser through X and
Reddit's own UI — the same clicks a human makes — instead of either
waiting for a click or calling an official API.

**Why a browser agent instead of the API.** No developer app, no OAuth
review, no per-post cost. The tradeoff, worth knowing going in: this uses
a real, full-access login session rather than a scoped API token, and
both platforms actively watch for automated browser sessions — treat the
captured session with the same care as a password, and know that this
carries a real account-safety risk an official API integration wouldn't.

### 1. Capture a login session (once, by hand, on your own machine)

```bash
npx playwright install chromium   # once
node scripts/capture-login-session.mjs x
node scripts/capture-login-session.mjs reddit
```

Each run opens a real browser, waits for you to log in normally, then
prints a value to set as an env var:

- `X_BROWSER_SESSION` — from the `x` capture
- `REDDIT_BROWSER_SESSION` — from the `reddit` capture

### 2. Set the cron secret

- `CRON_SECRET` — any random string. Vercel automatically sends it as
  `Authorization: Bearer $CRON_SECRET` on scheduled requests to
  `/api/cron/auto-deploy`; without it set, that route refuses every
  request rather than running unauthenticated.

### 3. Deploy

`vercel.json` already schedules `/api/cron/auto-deploy` every 30 minutes
(matching X's cooldown in `src/lib/autodeploy.ts` — Reddit's own 6-hour
cooldown just means most invocations are a no-op for that channel, which
is expected). **Vercel's Hobby plan only allows once-daily cron** — that
schedule needs Pro or above; on Hobby, change it to something like
`"0 14 * * *"` and accept a much slower posting cadence.

### How it actually works

The whole swarm/organism simulation lives in the browser's own
`localStorage` — there's no server-side copy of it. `autoStep` pushes the
current champion/live organisms into a small Postgres table
(`swarm_deploy_candidates`, see `migrations/0001_swarm_deploy_candidates.sql`)
whenever the app is open; the cron route reads *only* from that table, so
it can pick something to post and actually post it with zero browser tabs
open anywhere. `src/lib/cron-deploy.ts` picks the fittest not-yet-posted
candidate per channel and calls the real browser-agent poster in
`src/lib/browser-agent/`. Next time the app is open, it reads back
whatever the cron job posted and shows the real URL.

**Reddit posting stays narrow on purpose.** Several subs in
`REDDIT_PROMO_THREAD` (`src/lib/deploy.ts`) remove any product post from
the main feed and ban the account for it — the only safe target is that
week's official promo thread, and it changes weekly.
`findRedditPromoThreadImpl` (`src/lib/social-post.ts`) searches for it and
only returns a match when confident; the cron route only posts a comment
when a match is found, and never falls back to the main feed. No
confident match this cycle means no Reddit post this cycle — not a guess.
It also never comments twice into the same thread, even across different
organisms.

Without `X_BROWSER_SESSION` / `REDDIT_BROWSER_SESSION` set, the cron
route's posts simply fail with a clear "no session captured" error and
nothing gets marked posted — the manual buttons in the UI keep working
exactly as before as a fallback.

## Install (Android + Windows)

This is a progressive web app. There is **no Play Store APK** and **no Microsoft Store listing**. Chrome and Edge install SWARM as a real app window (home screen / Start menu / taskbar).

### Android (Chrome)

1. Open the live SWARM app in **Chrome** (not an in-app browser).
2. Tap **Get app**, or Chrome menu → **Install app** / **Add to Home screen**.
3. Launch SWARM from the home screen. Autopilot is already running.

### Windows (Edge or Chrome)

1. Open SWARM in Edge or Chrome.
2. Click **Get app**, or the install icon in the address bar.
3. Pin to Start or the taskbar. The title bar overlays Windows chrome.
4. Keyboard: `1–6` move, `A` autopilot, `I` install page.

## Product (multinicheai.com)

SWARM is SKU **[AI-AB-070](https://multinicheai.com/product/AI-AB-070)** — Automation Blueprints, Store & Site Owners, **$79.00** one-time.

- Cart: [multinicheai.com/?product=AI-AB-070](https://multinicheai.com/?product=AI-AB-070)
- Tools: [Store & Site Owners](https://multinicheai.com/tools/stores)
- The in-app **Product** page emits SQL, `catalog.mts`, live-proof, llms.txt, and JSON-LD in the store's own fields.

### Source zip

[Download this repository as a zip](https://github.com/duprejesse3-ops/swarm/archive/refs/heads/main.zip)

## Run locally

```bash
npm install
npm run dev
```

The app listens on `0.0.0.0:8080`. Autopilot uses the local genome only. Optional Grok copy requires `XAI_API_KEY` and a manual spawn.

## What “fully automatic” means

- Autopilot hijacks new intent pulses and spawns organisms — no click required.
- Running swarms tick on their own. Ripe swarms evolve. Losers die.
- Lab state (swarms, organisms, pulses, log) persists in the browser.
- Copy stays proof-first. Deploy packets still copy out of Studio / Swarm when you are ready to paste into Google, X, or a thread.

## Copyright

© 2026 MULTINICHE AI. All rights reserved.

SWARM Intent Autopilot (SKU AI-AB-070) is a product of [MULTINICHE AI](https://multinicheai.com).
See [LICENSE](LICENSE).

