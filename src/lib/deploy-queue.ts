// The client computes champions locally (the whole evolutionary simulation
// lives in browser localStorage — see store.ts). The cron route runs
// server-side with no browser tab open and no access to that localStorage.
// This is the bridge: the client pushes its current champion/live
// organisms here whenever they change, the cron route reads only from
// here, and the client reads back what actually got posted.
//
// See migrations/0001_swarm_deploy_candidates.sql for the table this reads
// and writes.

import { createServerFn } from "@tanstack/react-start";

export type DeployCandidateInput = {
  id: string;
  swarmId: string;
  sku: string;
  headline: string;
  body: string;
  proofHook: string;
  landingUrl: string;
  fitness: number;
  status: "champion" | "live";
};

/**
 * Upserts the client's current set of postable organisms. Called from
 * autoStep whenever champions/live organisms change — cheap and safe to
 * call often, since it's just keeping the server's view in sync with what
 * the client already computed, not doing any of the evolution itself.
 */
export const syncDeployCandidates = createServerFn({ method: "POST" })
  .validator((input: { candidates: DeployCandidateInput[] }) => input)
  .handler(async ({ data }) => {
    if (data.candidates.length === 0) return { synced: 0 };
    const { getSql } = await import("./db");
    const sql = await getSql();
    for (const c of data.candidates) {
      await sql`
        insert into swarm_deploy_candidates (id, swarm_id, sku, headline, body, proof_hook, landing_url, fitness, status, updated_at)
        values (${c.id}, ${c.swarmId}, ${c.sku}, ${c.headline}, ${c.body}, ${c.proofHook}, ${c.landingUrl}, ${c.fitness}, ${c.status}, now())
        on conflict (id) do update set
          headline = excluded.headline,
          body = excluded.body,
          proof_hook = excluded.proof_hook,
          landing_url = excluded.landing_url,
          fitness = excluded.fitness,
          status = excluded.status,
          updated_at = now()
      `;
    }
    return { synced: data.candidates.length };
  });

export type DeployStatus = {
  id: string;
  postedXUrl: string | null;
  postedXAt: string | null;
  postedRedditUrl: string | null;
  postedRedditAt: string | null;
};

/**
 * Reads back posted status for a set of organism ids, so the client can
 * update its local state (and the "Posted ✓" UI) to reflect a post the
 * cron job made while nobody had the app open.
 */
export const readDeployStatus = createServerFn({ method: "POST" })
  .validator((input: { ids: string[] }) => input)
  .handler(async ({ data }): Promise<DeployStatus[]> => {
    if (data.ids.length === 0) return [];
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      posted_x_url: string | null;
      posted_x_at: string | null;
      posted_reddit_url: string | null;
      posted_reddit_at: string | null;
    }>`
      select id, posted_x_url, posted_x_at, posted_reddit_url, posted_reddit_at
      from swarm_deploy_candidates
      where id = any(${data.ids})
    `;
    return rows.map((r) => ({
      id: r.id,
      postedXUrl: r.posted_x_url,
      postedXAt: r.posted_x_at,
      postedRedditUrl: r.posted_reddit_url,
      postedRedditAt: r.posted_reddit_at,
    }));
  });
