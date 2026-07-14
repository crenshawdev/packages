# Phase 2: Ghost stand-up & seed - Summary

Executed: 2026-07-13
Goal: Self-hosted Ghost running on the droplet under Coolify, seeded from the local
posts, with a Content API key and a Ghost-native newsletter wired to Mailgun.

## What shipped (all verified by live check)

- **GHST-01** - Ghost 5 + MySQL 8 deployed under Coolify on a DO droplet; admin reachable
  over HTTPS with a valid Let's-Encrypt cert; owner account created.
  Evidence: `https://ghost.jcrenshaw.dev/ghost/` -> 200; cert CN=ghost.jcrenshaw.dev
  (Let's Encrypt); `authentication/setup` -> `status:true`; both containers healthy.
- **GHST-02** - 18 posts + 1 page (`about`) seeded; title/slug/`published_at` match
  source; author = owner (John Crenshaw); both `__GHOST_URL__` markers rewritten;
  death-by-yes feature image re-sourced from Unsplash `orjeYhi09ZQ` and renders (200);
  seed idempotent. Evidence: Content API count = 18; pages = 1; idempotent re-run held
  at 18 (0 created, no collisions); 3-post spot check matched source.
- **GHST-03** - Content API key issued; `astro:env` schema + standalone verify script
  added; Content API returns 18 from the front-end env; `npm run build` green;
  `src/lib/content.ts` untouched. Evidence: `verify-content-api.mjs` -> "18 posts".
- **GHST-04** - Mailgun sending domain `mg.jcrenshaw.dev` verified (SPF+DKIM+MX, state
  active); Ghost wired to Mailgun (domain/key/US base URL in settings). Evidence:
  Mailgun events API `accepted -> delivered` to john@vintagetechie.com; user confirmed
  receipt. (Ghost-native newsletter test send not fired - see open items.)

## Commits (repo)

- `7a9984d` feat(2-1): seed Ghost from local markdown corpus (scripts/seed-ghost.mjs,
  package.json, package-lock.json, .env.example)
- `75fa6e0` feat(2-1): add Ghost Content API env schema + standalone verify
  (astro.config.mjs, scripts/verify-content-api.mjs)

Most of this phase is infra provisioning with no repo footprint (droplet, Coolify, Ghost,
MySQL, Cloudflare DNS, Mailgun). Those actions are recorded here as the log.

## Infra actions (non-repo)

- New droplet: SFO3, s-4vcpu-8gb (id 584389664, `137.184.184.60`), Ubuntu 24.04, +2 GB swap.
- Coolify 4.1.2 installed; instance domain `https://coolify.jcrenshaw.dev` (LE cert).
- Ghost 5 + MySQL 8 via Coolify one-click service at `https://ghost.jcrenshaw.dev`.
- Cloudflare DNS (grey-cloud): `coolify`, `ghost` A records; Mailgun `mg` SPF/DKIM/MX/CNAME.
- Old NYC droplet (`167.99.0.56`, id 584313199) destroyed after cutover confirmed.

## Deviations from plan

- **Region/size:** plan and PROJECT.md assumed the existing NYC droplet `167.99.0.56`
  (2vCPU/4GB). Destroyed it and stood up a fresh SFO3 8 GB box. Driver: John is in
  Atlanta; DO's ATL1/RIC1 carry no 8 GB size, so SFO3 (his stated fallback) + 8 GB for
  headroom on the Ghost+MySQL+Coolify+SSR stack. New IP `137.184.184.60`.
- **Ghost default content:** the fresh Ghost shipped a default `coming-soon` post that
  inflated the count to 19; deleted it as a one-off (not baked into the seed script, to
  avoid it deleting real Ghost-authored posts on future runs).
- **Dep placement:** `@tryghost/admin-api` + `gray-matter` went to devDependencies (plan
  said dependencies) - they are seed-only ops tooling, not runtime.
- **Single plan:** kept one PLAN.md vs CONTEXT's "multiple plans" - hard dependency chain
  + shared files; rationale recorded in PLAN Notes.
- **Mailgun:** free tier (100/day), not the $35 plan; region US; wired via Ghost's
  settings table (Ghost is Node, no config-file edit needed).

## Open items

- **Ghost-native newsletter test send not fired.** GHST-04 verified via direct Mailgun
  delivery + inbox confirmation; the one-click Ghost "send test email" (Settings > Email
  newsletter) not yet done. Newsletter is out of launch scope, so deferred.
- **Transactional SMTP unconfigured.** The Coolify Ghost service Mail User/Password/Host
  are still empty; magic-link/member emails won't send until set. Only needed if member
  signups are enabled later (subscribe UI is removed for launch).
- **PROJECT.md is stale** on infra: still says `167.99.0.56` / NYC / 4 GB. Update at the
  milestone (or now) to `137.184.184.60` / SFO3 / 8 GB.
- **Secrets hygiene:** `~/.do_token` (Full Access) was pasted inline and is in the session
  transcript - rotate/revoke it. `~/.cf_token`, `~/.mailgun_token`, and repo `.env` live on
  the workstation (`.env` gitignored).

## Goal check

The phase goal is met and independently verified end to end: Ghost + MySQL run under
Coolify on the droplet behind HTTPS, the 18 posts + about page are seeded with parity and
the dead image re-sourced, a Content API key returns the corpus from the front-end env,
and Mailgun is verified and delivering with Ghost wired to it. The only unmet slivers are
out-of-launch-scope confirmations (a Ghost-native newsletter click; transactional SMTP),
tracked above. Nothing blocks Phase 3 (Content API cutover).
