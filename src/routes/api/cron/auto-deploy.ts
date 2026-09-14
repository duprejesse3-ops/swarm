// Hit by Vercel Cron on a schedule (see vercel.json) — this is the piece
// that makes posting genuinely unattended: it runs server-side, on a
// timer, with no browser tab open anywhere and no client running. All the
// actual decision-making and posting logic lives in cron-deploy.ts; this
// file is deliberately thin, per the server-routes SKILL.md's own
// guidance to keep business logic in a service module and expose it
// through the route.
//
// Auth: Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on
// cron-triggered requests when a CRON_SECRET env var is configured
// (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
// Without CRON_SECRET set, this route refuses every request — an
// unauthenticated endpoint that can trigger a real public post is not a
// safe default to ship.

import { createFileRoute } from "@tanstack/react-router";
import { runAutoDeployCron } from "../../../lib/cron-deploy";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // no secret configured — refuse, don't run unauthenticated
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export const Route = createFileRoute("/api/cron/auto-deploy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthorized(request)) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const result = await runAutoDeployCron();
          return Response.json(result);
        } catch (err) {
          // A cron invocation failing is visible in Vercel's own
          // dashboard regardless of status code, but a clean 500 with the
          // real error is more useful there than a generic one.
          return Response.json(
            { error: err instanceof Error ? err.message : "auto-deploy cron failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
