# Phase 3: Content API cutover - Context

Gathered: 2026-07-13
Feeds: /cad-plan 3

## Scope boundary

In: Swap the live content source inside `src/lib/content.ts` from the markdown glob to the
Ghost Content API, keeping the module's public contract byte-identical so no consumer page
changes for render parity. Read Ghost via raw `fetch` (the proven `verify-content-api.mjs`
pattern), map Ghost JSON to the existing `Post` shape, rework `renderBody` to emit Ghost's
pre-rendered `html`, and fetch `about` from the Ghost pages endpoint. Add a `featureImage`
field to `Post` and wire `[slug].astro` to set `og:image` from it (fallback to the
site-wide card). Cover index latest-essay, writing index, `posts/[slug]`, about, and RSS.

Out: Per-post OG *card generation* (Phase 4 in-pipeline OG). Webhooks, Coolify auto-deploy,
staging/apex DNS (Phase 4/5). Any design or copy change. The markdown files stay in the
repo untouched (they remain the Ghost seed source of record).

Deferred: None.

Plan shape: one plan.

## Decisions

- D-01 (API client): `src/lib/content.ts` reads the Ghost Content API via raw `fetch`,
  mirroring `scripts/verify-content-api.mjs` (unversioned `/ghost/api/content/`,
  `limit=all`), with no `@tryghost/content-api` runtime dependency; the JSON is hand-mapped
  to `Post`. Chosen for the proven in-repo pattern and zero new runtime deps in the
  standalone Node SSR server. Evidence: `scripts/verify-content-api.mjs:16-17`; only
  `@tryghost/admin-api` installed (devDependency); `astro.config.mjs:15-20` already types
  `GHOST_URL` + `GHOST_CONTENT_API_KEY`.
- D-02 (Contract preserved): the module keeps its exact public surface -
  `getPublishedPosts()`, `getPostBySlug(slug)`, `renderBody(...)`, and the `Post` interface
  `{ id, slug, title, body, excerpt, metaDescription, publishedAt: Date, tags: string[] }`.
  Only internals change: map `published_at` string -> `Date`, Ghost `tags[].name` ->
  `string[]`, `meta_description` -> `metaDescription`, preserve the published sort. No
  consumer page is edited. Evidence: `src/lib/content.ts:3-56`; `writing.astro:18-24` and
  `posts/[slug].astro:19-24` require a real `Date` (`.getUTCFullYear()`/`.valueOf()`) and
  `tags: string[]` (`.tags[0]`).
- D-03 (Body + about page): `renderBody` is reworked to emit Ghost's pre-rendered `html` as
  a component the pages still render via `<Content />` (html injected with `set:html`), and
  the `'about'` lookup hits the Ghost pages endpoint (`/ghost/api/content/pages/`), not
  posts - the helper branches because it is called both as `renderBody(post.id)` and
  `renderBody('about')`. Internal mechanics are the planner's. Evidence:
  `src/lib/content.ts:50-56` (`getEntry('posts', id)` + `render()`); about is a Ghost page
  (Phase-2 CONTEXT D-03; `posts/page-about.md:4` `type: page`).
- D-04 (OG per-post image): `Post` gains a `featureImage` field and `posts/[slug].astro`
  sets `ogImage` from it, so each post's `og:image` is its Ghost `feature_image`, falling
  back to the site-wide `/og-image.png` when absent; `og:title`/`og:description` already
  derive from Ghost via `post.title` / `post.excerpt`. No per-post OG card generation this
  phase. Evidence: `BaseLayout.astro:40,59-69` (og fallback + meta emit); `og/render-og.mjs`
  renders three fixed cards; only `death-by-yes` carries a `feature_image` today.

## Acceptance criteria

- [ ] `src/lib/content.ts` imports nothing from `astro:content` (no `getCollection`,
      `getEntry`, or `render`); a grep for `astro:content` under `src/` returns zero hits,
      and content is fetched from `GHOST_URL`.
- [ ] Starting the SSR server, `/`, `/writing`, a `/posts/<slug>`, `/about`, and
      `/rss.xml` each return HTTP 200 with content from Ghost; `/writing` lists 18 posts and
      `/about` renders the Ghost page body.
- [ ] For a chosen slug, the SSR post page shows the same title, body prose, tag eyebrow,
      and newer/older navigation targets as the markdown build - no `NaN` dates, no
      `[object Object]` tags.
- [ ] `/rss.xml` returns well-formed XML whose `<item>` count and slugs match the
      `/writing` list.
- [ ] A post with a Ghost `feature_image` emits that URL in its `og:image` meta tag; a post
      without one falls back to `/og-image.png`.
- [ ] `npm run build` exits 0.

## Flagged assumptions

- Ghost Content API excerpt semantics: request `custom_excerpt` to preserve the
  hand-written frontmatter excerpts for index latest-essay and RSS `description` parity;
  planner confirms the field/behavior against the live API. If Ghost returns an
  auto-generated excerpt instead, index and RSS descriptions drift from the markdown build.
- Ghost's re-rendered `html` may differ from the markdown build's compiled output (smart
  quotes, entity encoding, card/figure wrappers), denting CUT-02 visual parity and shifting
  the `body.split(/\s+/)` word/read-time counts in `writing.astro:24` and
  `posts/[slug].astro:21-23`; planner diffs against the live API.
- Raw-fetch query specifics (`formats=html`, `fields`, `include=tags`) confirmed against the
  current Ghost Content API docs at plan time.
