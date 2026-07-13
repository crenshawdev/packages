# Phase 2: Ghost stand-up & seed - Context

Gathered: 2026-07-13
Feeds: /cad-plan 2

## Scope boundary

In: Stand up self-hosted Ghost + MySQL on the DO droplet (167.99.0.56) under Coolify with
a reachable, usable admin. Seed the fresh instance from the local corpus via an in-repo
Node script using the Ghost Admin API with `?source=html` (idempotent, re-runnable):
18 `type: post` posts plus `page-about.md` as a Ghost page, mapping frontmatter
(title, slug, published_at, created_at/updated_at, excerpt->custom_excerpt, tags, authors,
feature_image) and passing bodies as HTML. Rewrite both `__GHOST_URL__` markers and
re-source the one dead feature image. Issue a Content API key, add front-end env
scaffolding (`.env.example` + `astro:env` schema), and prove a Content API query with a
throwaway fetch. Configure the Ghost-native newsletter with Mailgun and prove a test send.

Out: The front-end Content API cutover - `src/lib/content.ts` is NOT modified this phase
(that swap is Phase 3). No webhooks, no Coolify auto-deploy of the site, no in-pipeline OG
regen (Phase 4), no apex/staging DNS cutover (Phase 4/5). No design or copy change.

Deferred: None.

Plan shape: multiple plans, same phase - /cad-plan breaks the four workstreams
(stand-up, seed+markers+image, Content API key+env, Mailgun newsletter) into plans.

## Decisions

- D-01 (Stand-up): Deploy Ghost + MySQL under Coolify on the DO droplet; admin reachable and usable over HTTPS. Whether Coolify provides a Ghost service template or needs a hand-written compose/service is external research (no codebase footprint). Evidence: PROJECT.md infra block (droplet 167.99.0.56, Coolify admin registered); repo is purely the Astro front end.
- D-02 (Seed mechanism): An in-repo Node script POSTs each post to the Ghost Admin API with `?source=html` (HTML->lexical), idempotent and re-runnable, sited alongside `og/render-og.mjs`. Chosen over a hand-authored Ghost `db`-export JSON import for scriptability and re-runnability, and because no export JSON was kept. Evidence: bodies are pre-rendered Ghost-export HTML (`posts/2026-01-30-death-by-yes.md:20`, `posts/page-about.md:15-20`); field set at `src/content.config.ts:6-23`.
- D-03 (Corpus): The corpus is 18 `type: post` + 1 `type: page`. `page-about.md` (slug `about`) is seeded as a Ghost page, not a post, so it stays out of the writing index, RSS, and any newsletter send. The ROADMAP/REQUIREMENTS "19 posts" phrasing conflates the about page. Evidence: `grep ^type:` -> 18 post / 1 page; Phase-1 filter `entry.data.type === 'post'` (`src/lib/content.ts:18`); Phase-1 SUMMARY records "RSS carries 18 items."
- D-04 (URL markers): The seed rewrites both `__GHOST_URL__` occurrences, not only the one the ROADMAP names: the `death-by-yes` `feature_image` and the inline internal link in `posts/2026-02-09-building-my-system-piece-by-piece.md:21` (-> `/still-skidding-broadside/`). Evidence: repo-wide grep matches exactly those two lines; no other external image/link refs in any body.
- D-05 (Dead image): Re-fetch Unsplash photo `orjeYhi09ZQ` (the original `alexander-gluschenko-...-unsplash.jpg`), upload it to the fresh Ghost, and point the seeded `death-by-yes` post at the new Ghost-hosted URL. Evidence: `grep ^feature_image:` matches only `posts/2026-01-30-death-by-yes.md:8`; filename encodes the Unsplash photo id.
- D-06 (Content API + verify home): Issue a Content API key and add `.env.example` plus an `astro:env` schema declaring `GHOST_URL` and `GHOST_CONTENT_API_KEY`; prove criterion 3 with a throwaway/standalone node fetch. `src/lib/content.ts` is not touched this phase. Exact key type / API version to issue for clean Phase-3 consumption is flagged for planner research. Evidence: repo-wide grep finds zero `GHOST_`/`CONTENT_API`/`@tryghost` refs, no `.env`/`.env.example`, `astro.config.mjs` declares no `env` schema.
- D-07 (Newsletter): Configure the Ghost-native newsletter with Mailgun as the delivery provider and prove a test send is delivered. The exact config path (Mailgun API key + region vs SMTP, SPF/DKIM DNS on the sending domain) is flagged for planner research. Evidence: no Mailgun refs in repo; self-hosted Ghost bulk email config has no codebase footprint.

## Acceptance criteria

- [ ] The Ghost admin URL on the droplet returns the Ghost admin app over HTTPS and an owner account signs in successfully.
- [ ] After the seed run, Ghost holds exactly 18 posts and 1 page (`about`); each post's title, slug, and `published_at` match its source frontmatter, and `about` does not appear in the post/writing list.
- [ ] No seeded content or rendered Ghost output contains the literal string `__GHOST_URL__`; the `death-by-yes` post renders a visible feature image, and the `building-my-system` internal link resolves to `/still-skidding-broadside/`.
- [ ] A Content API query using `GHOST_URL` + `GHOST_CONTENT_API_KEY` from the `.env` config returns the 18 seeded posts.
- [ ] `.env.example` and an `astro:env` schema declare `GHOST_URL` and `GHOST_CONTENT_API_KEY`, and `src/lib/content.ts` still imports only `astro:content` (unchanged this phase).
- [ ] A Ghost newsletter test send to a real address is delivered via Mailgun (arrives in an inbox).

## Flagged assumptions

- Ghost + MySQL memory footprint on the 4GB droplet may require swap or MySQL tuning; Coolify may or may not ship a Ghost service template (else a hand-written compose/service is needed) - external research, no codebase footprint.
- Mailgun config path for self-hosted Ghost bulk email (API key + region vs SMTP, required SPF/DKIM DNS on the sending domain) - external research; if wrong, GHST-04 test send fails.
- Which Content API key type / API version to issue now so the Phase-3 front end (raw `fetch` vs `@tryghost/content-api`) consumes it cleanly - external research; issued at the current Ghost Content API version.
