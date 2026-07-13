---
phase: 2
plan: 1
requirements: [GHST-01, GHST-02, GHST-03, GHST-04]
files:
  - scripts/seed-ghost.mjs
  - scripts/verify-content-api.mjs
  - package.json
  - .env.example
  - astro.config.mjs
---

# Phase 2: Ghost stand-up & seed - Plan

## Goal

Self-hosted Ghost is running on the DO droplet under Coolify, seeded from the
19 local posts (18 posts + 1 page), with a Content API key and a Ghost-native
newsletter wired to Mailgun.

## Must be true when done

- The Ghost admin URL on the droplet returns the admin app over HTTPS and an owner account signs in.
- Ghost holds exactly 18 posts and 1 page (`about`); every post's title, slug, and `published_at` match its source frontmatter, and `about` is a page (absent from the post list).
- No seeded content contains the literal `__GHOST_URL__`; the `death-by-yes` post renders a visible feature image and the `building-my-system` inline link resolves to `/still-skidding-broadside/`.
- A Content API query using `GHOST_URL` + `GHOST_CONTENT_API_KEY` returns the 18 seeded posts.
- `.env.example` and an `astro:env` schema declare `GHOST_URL` and `GHOST_CONTENT_API_KEY`, and `src/lib/content.ts` still imports only `astro:content` (untouched this phase).
- A Ghost newsletter test send to a real address is delivered via Mailgun and arrives in an inbox.

## Context

Locked decisions (CONTEXT.md D-01..D-07): Ghost + MySQL under Coolify on
167.99.0.56; seed is an in-repo idempotent Node script hitting the Ghost Admin
API with `?source=html`, sited alongside `og/render-og.mjs` (use `scripts/`);
corpus is 18 `type: post` + 1 `type: page` (`page-about.md` slug `about`,
seeded as a Ghost PAGE); rewrite BOTH `__GHOST_URL__` markers
(`posts/2026-01-30-death-by-yes.md:8` feature_image and
`posts/2026-02-09-building-my-system-piece-by-piece.md:21` inline link);
re-source Unsplash `orjeYhi09ZQ` for the dead image. Every post's `authors`
frontmatter is the single display-name string "John Crenshaw", which the Ghost
Admin API cannot resolve; the seed defaults authorship to the owner account.
Bodies are already Ghost-export HTML; the field set matches
`src/content.config.ts:6-23`.
Out of scope this phase: `src/lib/content.ts` must NOT change (Content API
cutover is Phase 3), no webhooks, no Coolify auto-deploy, no OG regen, no DNS
cutover. `.env`/`.env.production` are already gitignored; only `.env.example`
is committed. Three flagged items require external research at execution time
(Coolify Ghost template vs compose + 4GB tuning; Mailgun config path + DNS;
Content API key type/version) - research them, do not invent config values.

## Tasks

### Task 1: Stand up Ghost + MySQL under Coolify

- **Files:** none in repo (infra provisioning on the droplet under Coolify).
- **Action:** Research first whether Coolify ships a Ghost service template or
  needs a hand-authored docker-compose service, and the memory footprint of
  Ghost + MySQL on the 4GB droplet (the box also runs Coolify + will run SSR);
  add swap and/or MySQL buffer-pool tuning if the footprint is tight - do not
  assume it fits. Deploy Ghost with a MySQL 8 database under Coolify on
  167.99.0.56, expose the admin over HTTPS (Coolify/Let's-Encrypt on a
  subdomain that resolves - use a temporary Ghost/staging hostname, NOT the
  apex, since apex/DNS cutover is Phase 4/5). Complete the Ghost setup wizard
  to create the owner account. Record the resolved admin URL for later tasks.
  Avoid the SQLite dev default - production Ghost requires MySQL, and Phase 3
  reads this same instance.
- **Verify:** `curl -sI https://<ghost-admin-host>/ghost/` returns HTTP 200/302
  over a valid HTTPS cert, and signing in with the owner account loads the Ghost
  admin dashboard in a browser.

### Task 2: Write the idempotent seed script with field mapping and marker rewrites

- **Files:** scripts/seed-ghost.mjs, package.json, .env.example
- **Action:** Add `@tryghost/admin-api` to package.json dependencies and a
  `"seed": "node --env-file=.env scripts/seed-ghost.mjs"` npm script. Write
  `scripts/seed-ghost.mjs` (ES module, matching the standalone style of
  `og/render-og.mjs`): read every `posts/*.md`, parse frontmatter + HTML body
  (front-matter is Ghost-export shaped per `src/content.config.ts`), and map
  each entry to a Ghost Admin API payload - `title`, `slug`, `status` (every
  source file is `status: published`; pass it explicitly - the Admin API
  defaults new content to `draft` and the Content API returns only published,
  so omitting it seeds everything as invisible drafts and fails Tasks 3/4),
  `custom_excerpt` from `excerpt`, `published_at`, `created_at`, `tags`,
  `feature_image`, `meta_title`, `meta_description` - passing the HTML body via
  the `?source=html` query so Ghost converts HTML to lexical. Do NOT map the
  frontmatter `updated_at` into the payload (see idempotency below). Route
  `type: page` entries (only `page-about.md`, slug `about`) to the Admin API
  `pages` endpoint and all `type: post` entries to the `posts` endpoint so
  `about` becomes a Ghost page, not a post. Make the run idempotent: for each
  entry look up the existing Ghost post/page by slug and PUT-update it if
  present, else POST-create, so re-running never duplicates. On PUT-update,
  send the `updated_at` value returned by that per-slug lookup GET, never the
  frontmatter `updated_at`: Ghost requires the server's current `updated_at`
  for collision detection and rejects a stale one with HTTP 409 ("Saving
  failed! Someone else is editing this post"), which would break the required
  idempotent re-run. Do NOT pass the
  frontmatter `authors` display-name strings ("John Crenshaw") into the payload
  `authors` field - the Ghost Admin API resolves authors by id/slug/email and
  bare display names error the call or silently drop; omit `authors` so Ghost
  defaults authorship to the owner account created in Task 1 (single-author
  site, owner is John Crenshaw). Rewrite the inline
  `__GHOST_URL__` marker in the `building-my-system` body to the relative
  `/still-skidding-broadside/` before sending. Authenticate with an Admin API
  key read from `process.env.GHOST_ADMIN_API_URL` + `process.env.GHOST_ADMIN_API_KEY`
  (a Custom Integration key created in Ghost admin - Settings > Integrations).
  Add `GHOST_ADMIN_API_URL` and `GHOST_ADMIN_API_KEY` to `.env.example` with
  placeholder values and a comment that they are Admin-API-only, not shipped to
  the front end. Include a `--dry-run` flag that parses and maps every file and
  prints the resulting slug / type / status / published_at / feature_image per entry
  without any network write, and that hard-fails if the literal `__GHOST_URL__`
  survives in any outbound payload except the death-by-yes feature_image (which
  Task 3 resolves). Do NOT touch `src/lib/content.ts`.
- **Verify:** `node scripts/seed-ghost.mjs --dry-run` (no `.env` needed for
  dry-run) prints exactly 18 `post` entries and 1 `page` entry (`about`), each
  with `status: published` plus its source `published_at` and slug, and reports
  zero `__GHOST_URL__` strings in bodies.

### Task 3: Re-source the dead image and run the seed against live Ghost

- **Files:** scripts/seed-ghost.mjs
- **Action:** Extend the seed script so that before seeding the `death-by-yes`
  post it re-fetches the original Unsplash photo `orjeYhi09ZQ`
  (`alexander-gluschenko-...-unsplash.jpg`) at full resolution, uploads it to
  Ghost via the Admin API `images/upload` endpoint, captures the returned
  Ghost-hosted `/content/images/...` URL, and uses that URL as the
  `feature_image` for `death-by-yes` in place of the `__GHOST_URL__` marker.
  Make the upload idempotent-safe (skip re-upload if the post already carries a
  Ghost-hosted feature image, or key on a stable filename). Then run the full
  seed against the live Ghost from Task 1 using real Admin API credentials in
  `.env`. After a successful run, re-run once to confirm idempotency (counts
  unchanged, no duplicates).
- **Verify:** After `npm run seed`, the Ghost admin shows exactly 18 posts and
  1 page; a spot check of 3 posts confirms title/slug/`published_at` match
  their source frontmatter and each shows the owner (John Crenshaw) as author;
  the `death-by-yes` post renders a visible feature
  image; the `building-my-system` post's inline link points to
  `/still-skidding-broadside/`; grepping the rendered post HTML shows no
  `__GHOST_URL__`; and a second `npm run seed` leaves the counts at 18/1.

### Task 4: Issue a Content API key, add env scaffolding, and prove a query

- **Files:** astro.config.mjs, .env.example, scripts/verify-content-api.mjs
- **Action:** Research the current Ghost Content API version and the key type
  the Phase-3 front end will consume cleanly, then create a Content API key in
  Ghost admin (Settings > Integrations). Add an `astro:env` schema to
  `astro.config.mjs`: import `envField` from `astro/config` and declare an
  `env.schema` with `GHOST_URL` (string, `context: 'server'`, `access: 'public'`)
  and `GHOST_CONTENT_API_KEY` (string, `context: 'server'`, `access: 'secret'`);
  do not change `output`, `adapter`, `trailingSlash`, `build`, or `fonts`. Add
  `GHOST_URL` and `GHOST_CONTENT_API_KEY` to `.env.example` with placeholder
  values. Write `scripts/verify-content-api.mjs` as a standalone throwaway
  check that reads `process.env.GHOST_URL` + `process.env.GHOST_CONTENT_API_KEY`
  and does a raw `fetch` against
  `${GHOST_URL}/ghost/api/content/posts/?key=${key}&limit=all` (no
  `@tryghost/content-api` dependency needed), then prints the returned post
  count. Do NOT modify `src/lib/content.ts` (Content API consumption is Phase 3).
- **Verify:** `npm run build` succeeds with the new `astro:env` schema;
  `node --env-file=.env scripts/verify-content-api.mjs` prints a count of 18
  posts; and `grep -n "astro:content" src/lib/content.ts` still shows the sole
  import (file unchanged).

### Task 5: Configure the Ghost newsletter with Mailgun and prove a test send

- **Files:** none in repo (Ghost admin + Mailgun + DNS configuration).
- **Action:** Research the Mailgun config path for self-hosted Ghost bulk email
  first: Mailgun API key + region (US vs EU base URL) as configured in Ghost's
  `mail`/`bulkEmail` settings, plus the SPF and DKIM DNS records required on the
  sending domain - do not invent keys, regions, or DNS values, obtain them from
  the Mailgun account and set the real records. Configure Ghost's newsletter to
  use Mailgun as the bulk email provider, verify the sending domain in Mailgun
  (SPF/DKIM propagated), then send a Ghost newsletter test send to a real
  inbox (`john@vintagetechie.com`).
- **Verify:** The Ghost newsletter test send is accepted by Ghost/Mailgun (no
  provider error) and the test email arrives in the target inbox; the Mailgun
  logs show the message delivered.

## Notes

- Plan shape: CONTEXT.md suggested "multiple plans, same phase," but this is a
  single PLAN.md by deliberate choice. The four workstreams form one hard
  dependency chain - the seed (Tasks 2-3) needs Ghost stood up (Task 1), the
  Content API verify (Task 4) needs the seed to have run, and the newsletter
  (Task 5) still depends on stand-up - and Tasks 2/3/4 share
  `scripts/seed-ghost.mjs`, `.env.example`, and `package.json`. No genuinely
  independent slice with non-overlapping files and no cross-slice ordering
  exists, so splitting would violate the no-shared-files / no-cross-slice-order
  rule. Task sequencing inside the one plan carries the ordering instead.
- Human-required setup the executor cannot self-serve: the Ghost owner account
  and setup wizard (Task 1), the Custom Integration Admin API key and the
  Content API key created in Ghost admin (Tasks 2/4), and the Mailgun account +
  API key + DNS records (Task 5). Populate the real values into `.env` (already
  gitignored); only `.env.example` placeholders are committed.
- Seed script is sited in `scripts/` as the peer to `og/render-og.mjs`; both are
  standalone Node ES modules run outside the Astro build.
- Content API key type/version, Coolify Ghost template-vs-compose + 4GB tuning,
  and the Mailgun config path are the three CONTEXT.md flagged research items -
  resolve each against live docs at execution time.
