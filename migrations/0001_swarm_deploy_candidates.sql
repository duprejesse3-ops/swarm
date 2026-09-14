-- The deploy-candidate queue: how a server-side cron job (no browser tab,
-- no client running) knows what to post and to whom.
--
-- Everything else in this app — swarms, organisms, evolution — lives in the
-- browser's localStorage (see src/lib/store.ts's zustand persist). That's
-- fine for the simulation itself, but it means a server-side job has
-- nothing to read: there is no swarm state anywhere the server can see.
--
-- Rather than move the whole simulation server-side (a much bigger
-- project), the client pushes just what a poster needs — the current
-- champion/live organism per running swarm — into this table whenever it
-- changes (see syncDeployCandidates in src/lib/social-post.ts). The cron
-- route then works from this table alone: pick the best not-yet-posted
-- row per channel, post it for real via browser automation, write back
-- posted_*_url/at here. The client reads posted_*_url back on its next
-- sync to show "Posted ✓" in the UI.
--
-- One row per organism. Posting to X and Reddit are tracked independently
-- (posted_x_* / posted_reddit_*) so the same organism can be posted to
-- one channel, still waiting on the other.
create table if not exists swarm_deploy_candidates (
  id text not null primary key, -- the client's organism id
  swarm_id text not null,
  sku text not null,
  headline text not null,
  body text not null,
  proof_hook text not null,
  landing_url text not null,
  fitness real not null default 0,
  status text not null, -- 'champion' | 'live' — see src/lib/types.ts OrganismStatus
  updated_at timestamptz not null default now(),
  posted_x_url text,
  posted_x_at timestamptz,
  posted_reddit_url text,
  posted_reddit_at timestamptz,
  -- Which promo-thread comment this organism's Reddit post landed in, so a
  -- second organism is never posted into the same weekly thread twice —
  -- checked independently of posted_reddit_url (that's this organism's own
  -- history; this is "has ANY organism already used this thread").
  posted_reddit_thread_id text
);

-- The cron job's actual query shape: "cheapest not-yet-posted-to-X
-- candidate, fittest first" — this index serves exactly that scan.
create index if not exists swarm_deploy_candidates_unposted_x_idx
  on swarm_deploy_candidates (fitness desc)
  where posted_x_url is null;

create index if not exists swarm_deploy_candidates_unposted_reddit_idx
  on swarm_deploy_candidates (fitness desc)
  where posted_reddit_url is null;
