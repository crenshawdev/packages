---
phase: 3
status: complete
completed: 2026-07-13
---

# Phase 3: Content API cutover - Summary

The front end now reads every post and the about page from the Ghost Content API over raw `fetch` through `src/lib/content.ts`, with the markdown glob retired as a live source and per-post `og:image` derived from Ghost's `feature_image`.

## What shipped

- Ghost Content API data source - `src/lib/content.ts` rewritten: `fetchGhost` raw-`fetch`es the unversioned `/ghost/api/content/` endpoint (`limit=all`, no `@tryghost/content-api` dep), maps Ghost JSON to the unchanged `Post` shape (`custom_excerpt`->excerpt, `html`->body, `published_at`->Date, `tags[].name`->string[]), adds `featureImage`, sorts by `publishedAt` desc for neighbor-nav parity, and `renderBody` branches to the Ghost pages endpoint for `about`, emitting pre-rendered html via `createComponent`/`unescapeHTML`.
- Per-post OG image - `src/pages/posts/[slug].astro` sets `ogImage` from `post.featureImage`, falling back to the site-wide `/og-image.png` when absent.
- Dead markdown collection removed - `src/content.config.ts` deleted; `astro:content` no longer referenced anywhere under `src/`. The `./posts/*.md` files stay on disk as the Ghost seed of record.

## Commits

| Plan | Task | Commit | Description |
|---|---|---|---|
| 1 | 1 | 2752568 | Read content from Ghost Content API in content.ts |
| 1 | 2 | 58b93f3 | Emit per-post og:image from Ghost feature image |
| 1 | 3 | fee555c | Remove dead markdown content collection config |

## Deviations

None - plans executed as written.

## Open items

- No Ghost-outage fallback (advisory diff review, medium): with `output:'server'` and no prerender, every request hits the Ghost API and any non-OK/failed fetch throws with no degradation - a Ghost 503 or brief unreachability renders a site-wide 500. Not in Phase-3 scope (D-01 locked raw fetch); flag for Phase 4 hardening (cache/fallback) when the pipeline and staging land.
- Accepted-by-design, raised advisory but owned by locked decisions: `renderBody` re-calls `getPublishedPosts()` (double full-catalog fetch per post view) is the D-02 zero-prop `<Content/>` contract; the API key in the URL query string is the D-01 pattern mirroring `verify-content-api.mjs` on self-hosted Ghost; the `astro/runtime/server` internal import fragility is adjudicated in PLAN Notes (pinned Astro 6.4.8, bounded).
- RSS parity notes (not regressions): four posts emit empty `<description>` - byte-identical to the markdown build (those posts had no `excerpt`/`meta_description`). RSS `<link>` slugs carry a trailing slash from `@astrojs/rss` normalization while `/writing` links are extensionless; slug values and order match. Both are pre-existing RSS-generation behavior, untouched this phase.

## Goal check

The three commits deliver the phase goal. Success criterion 1 (data-source reads Ghost, markdown glob no longer live) is met: `grep -rn astro:content src/` returns zero hits and `content.config.ts` is deleted, so content is fetched over HTTP from `GHOST_URL`. Criterion 2 (index latest-essay, writing, `posts/[slug]`, about, RSS render from Ghost with no regression) is met: the executor verified all five routes return 200 against the live dev server, `/writing` lists 18 posts with real dates and word tags (no `NaN`, no `[object Object]`), `the-last-default` holds read-time parity (7 min, ~1,514 words within the accepted lexical-round-trip drift), `/about` renders the Ghost page body, and `/rss.xml` is well-formed with 18 items whose slugs and hand-written excerpts match. Criterion 3 (OG card data derived from Ghost) is met: `death-by-yes` emits its Ghost `feature_image` as `og:image` and a post without one falls back to the site card. `npm run build` exits 0. Nothing is missing against the phase goal; the one substantive gap named is operational (no fallback on Ghost downtime), correctly deferred to Phase 4.
