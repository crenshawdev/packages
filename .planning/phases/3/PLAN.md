---
phase: 3
plan: 1
requirements: [CUT-01, CUT-02, CUT-03]
files:
  - src/lib/content.ts
  - src/content.config.ts
  - src/pages/posts/[slug].astro
---

# Phase 3: Content API cutover - Plan

## Goal

The front end reads all content from the Ghost Content API through the Phase-1
`src/lib/content.ts` abstraction, rendering index, writing, `posts/[slug]`,
about, and RSS with parity against the markdown build.

## Must be true when done

- No file under `src/` imports `astro:content`; `grep -rn astro:content src/`
  returns zero hits, and content is fetched over HTTP from `GHOST_URL`.
- With the dev server up, `/`, `/writing`, a `/posts/<slug>`, `/about`, and
  `/rss.xml` each return HTTP 200 with content from Ghost; `/writing` lists 18
  posts and `/about` renders the Ghost page body.
- A chosen post page (e.g. `the-last-default`) shows the same title, body prose,
  tag eyebrow, filed date, read-time, and newer/older nav as the markdown
  build - no `NaN` dates, no `[object Object]` tags.
- `/rss.xml` is well-formed XML whose `<item>` count and slugs match `/writing`,
  with the hand-written excerpts as `<description>`.
- `/posts/death-by-yes` emits its Ghost `feature_image` URL as `og:image`; a
  post without one falls back to `/og-image.png`.
- `npm run build` exits 0.

## Context

Binding CONTEXT decisions: D-01 raw `fetch` to the unversioned
`/ghost/api/content/` endpoint (no `@tryghost/content-api` runtime dep,
`limit=all`); D-02 keep the exact public surface of `src/lib/content.ts`
(`getPublishedPosts`, `getPostBySlug`, `renderBody`, and the `Post` interface)
with only internals changing, no consumer page edited except `[slug].astro`;
D-03 `renderBody` emits Ghost's pre-rendered `html` as a `<Content />` component
via `set:html` and branches to the Ghost **pages** endpoint for `'about'`; D-04
`Post` gains `featureImage` and `[slug].astro` sets `og:image` from it.

Verified live against `https://ghost.jcrenshaw.dev`: map `custom_excerpt` (the
full hand-written excerpt - the `excerpt` field is truncated) to `Post.excerpt`,
`html` to `Post.body`, `meta_description` to `metaDescription`, `published_at`
to a `Date`, `tags[].name` to `string[]`, `feature_image` to `featureImage`.
Ghost's re-rendered `html` matches the markdown source closely (read-time
parity holds; no card wrappers or smart-quote rewrites). The Content API returns
only published public posts, so no explicit published filter is needed. The
`about` page is at the pages endpoint under slug `about`. Env vars
`GHOST_URL`/`GHOST_CONTENT_API_KEY` are already declared in `astro.config.mjs`
and live in the workstation `.env` (Astro loads `.env` in dev and build). Out of
scope: per-post OG *card generation* (Phase 4), any consumer page redesign, and
the markdown files (they stay on disk as the Ghost seed of record).

## Tasks

### Task 1: Cut src/lib/content.ts over to the Ghost Content API

- **Files:** src/lib/content.ts
- **Action:** Replace the entire module. Remove the `astro:content` import and
  the `getCollection`/`getEntry`/`render`/`PostEntry`/`toPost`/`isPublished`
  internals. Keep the exact public surface: the `Post` interface, plus
  `getPublishedPosts()`, `getPostBySlug(slug)`, `renderBody(id)`. Add one field
  `featureImage: string | null` to `Post` (all other `Post` fields stay
  byte-identical to today). Read the two env vars via
  `import { GHOST_URL, GHOST_CONTENT_API_KEY } from 'astro:env/server'` (both
  declared in `astro.config.mjs`); throw a clear Error if either is missing.
  Write an internal `fetchGhost(resource, params)` helper that raw-`fetch`es
  `${GHOST_URL}/ghost/api/content/${resource}/?key=${GHOST_CONTENT_API_KEY}&${params}`
  (mirroring `scripts/verify-content-api.mjs`, unversioned path, no
  `@tryghost/content-api` dependency) and throws on a non-OK response.
  `getPublishedPosts()` calls `fetchGhost('posts',
  'limit=all&include=tags&formats=html&fields=id,slug,title,html,custom_excerpt,meta_description,published_at,feature_image')`,
  maps each Ghost post to `Post` with `body = html ?? ''`, `excerpt =
  custom_excerpt ?? null` (use `custom_excerpt`, NOT the truncated `excerpt`
  field, so index and RSS descriptions match the markdown build),
  `metaDescription = meta_description ?? null`, `publishedAt = new
  Date(published_at)`, `tags = (tags ?? []).map(t => t.name)`, `featureImage =
  feature_image ?? null`, `slug = slug`, `id = id`, then sorts by
  `publishedAt.valueOf()` descending (do not rely on the API's default order -
  neighbor-nav parity depends on this explicit sort). `getPostBySlug(slug)`
  keeps its current awaited two-line body - `const posts = await
  getPublishedPosts();` then `return posts.find(p => p.slug === slug);`. Do not
  collapse it to `getPublishedPosts().find(...)`: that drops the `await` and
  calls `.find` on a Promise. Rework
  `renderBody(id)` to branch: when `id === 'about'`, call `fetchGhost('pages',
  'filter=slug:about&formats=html&fields=html')` and take `pages?.[0]?.html`
  (guard the empty/undefined array rather than reading `pages[0].html`
  directly, so a missing or unpublished Ghost about page throws the intended
  clear Error below, not an opaque `Cannot read properties of undefined`
  TypeError); otherwise resolve the post's `html` by finding the matching `id`
  in `getPublishedPosts()`; throw the existing `No post entry found for id
  "..."` Error when neither resolves. Return `{ Content }` where `Content` is built
  with `createComponent(() => renderTemplate\`${unescapeHTML(html)}\`)`
  imported from `astro/runtime/server/index.js` - this is exactly what an
  Astro `set:html={html}` expression compiles to, so `<Content />` in the pages
  renders the raw Ghost HTML unescaped and unchanged. Do not edit any consumer
  page in this task.
- **Verify:** `grep -n "astro:content" src/lib/content.ts` returns nothing.
  `npm run build` exits 0. Start the dev server (`npm run dev`, which loads
  `.env`) and confirm: `curl -s localhost:4321/writing | grep -c 'entry-title'`
  prints `18`; `curl -s localhost:4321/writing` shows real month/day dates and
  word tags (no `NaN`, no `[object Object]`);
  `curl -s localhost:4321/posts/the-last-default` returns the post title and
  body prose and a `filed`/`read`/`words` byline; `curl -s localhost:4321/about`
  contains Ghost about-page prose (e.g. the string `EAS Technologies`);
  `curl -s localhost:4321/rss.xml` is well-formed XML with 18 `<item>` elements
  whose slugs match the `/writing` links and whose `<description>` carries the
  hand-written excerpts. Index latest-essay parity:
  `curl -s localhost:4321/` shows the newest post's title (`The Last Default`)
  as the writing-card link and its hand-written excerpt text (the
  `custom_excerpt`, e.g. the string `kernel panicked`) in the card. Word/
  read-time parity spot check: on `/posts/the-last-default` the byline reads
  `7 min` and ~`1,514` words - this is the accepted, verified drift from the
  markdown build's `1,526` words / `7 min` (identical read-time; ~12-word delta
  from Ghost's lexical round-trip, since `body` is now Ghost HTML and the
  unchanged `body.split(/\s+/)` count in `writing.astro:24` and
  `posts/[slug].astro:21-23` tokenizes the same HTML shape - no card wrappers,
  same 13 `<p>` / 5 `<a>` tags). Treat a same read-time and a single-digit-percent
  word delta on this post as parity; a materially different count signals a
  mapping regression.

### Task 2: Emit per-post og:image from the Ghost feature image

- **Files:** src/pages/posts/[slug].astro
- **Action:** In the frontmatter, derive an `ogImage` value from
  `post.featureImage`: when `post.featureImage` is a non-empty string use it as
  the og image, otherwise leave it undefined so `BaseLayout` applies its
  site-wide `/og-image.png` default (BaseLayout only overrides when the
  `ogImage` prop is set). Pass that value as the `ogImage` prop to
  `<BaseLayout ...>`. Because Ghost's `feature_image` is an absolute
  `https://ghost.jcrenshaw.dev/...` URL and BaseLayout builds its default
  through `new URL(...)`, pass the Ghost URL such that the emitted
  `<meta property="og:image">` is that absolute Ghost URL verbatim (do not
  prefix it with the site base). Make no other change to this file - the
  newer/older nav, byline, and word/read-time logic stay exactly as they are.
  Accepted this phase: `BaseLayout.astro:63-64` keeps its hardcoded
  `og:image:width`/`height` of 1200x630 even when a Ghost feature image of other
  dimensions is used. This does not block CUT-03 (crawlers treat the tags as
  hints and re-derive from the actual image); do not touch BaseLayout. Phase 4's
  in-pipeline OG regeneration owns per-post card dimensions.
- **Verify:** `npm run build` exits 0. With the dev server up,
  `curl -s localhost:4321/posts/death-by-yes | grep 'og:image'` shows a
  `content` of `https://ghost.jcrenshaw.dev/content/images/2026/07/orjeYhi09ZQ-unsplash.jpg`;
  `curl -s localhost:4321/posts/the-last-default | grep 'og:image'` shows the
  site-wide `/og-image.png` fallback (that post has no feature image).

### Task 3: Remove the dead markdown content collection config

- **Files:** src/content.config.ts
- **Action:** Delete `src/content.config.ts` entirely. After Task 1 nothing
  imports the `posts` collection or `astro:content`, so this glob-collection
  definition is dead and is the last `astro:content` reference under `src/`.
  Deleting it makes the markdown glob no longer a live content source while
  leaving the `./posts/*.md` files untouched on disk (they remain the Ghost
  seed of record). Do not delete or move any file under `posts/`.
- **Verify:** `grep -rn "astro:content" src/` returns zero hits. `npm run build`
  exits 0 and the dev-server route sweep from Task 1 still returns 200 for `/`,
  `/writing`, `/posts/<slug>`, `/about`, and `/rss.xml`.

## Notes

- Runtime env: the SSR server needs `GHOST_URL` and `GHOST_CONTENT_API_KEY` in
  its process environment. They already exist in the workstation `.env` and are
  documented in `.env.example`; Phase 4 provisions them in the Coolify deploy
  environment. No plan file change is needed for this.
- On the `renderBody` internal import (`astro/runtime/server/index.js`): the
  locked D-02/D-03 contract - consumer pages keep a zero-prop `<Content />` and
  are not edited - forces `renderBody` to hand off a pre-built component factory
  with the html already bound. Astro validates components by an internal factory
  symbol, so binding props to a zero-arg call site requires `createComponent`
  (and, for the `.astro` variant, `renderComponent`) from `astro/runtime/server`
  either way. The suggested `src/components/RenderedContent.astro` +
  `<Fragment set:html={html} />` fallback therefore does NOT remove the internal
  dependency; it only moves the `unescapeHTML` step behind a component file. The
  leaner direct form is preferred for that reason. The upgrade-fragility is
  real but bounded: Astro is pinned at 6.4.8, this is a private self-hosted
  build (not a published library), the path resolves through the package's
  `./runtime/*` export, and any Astro bump is a deliberate, verified step. If a
  future upgrade breaks the import, switch to the `RenderedContent.astro`
  variant - the `<Content />` call sites and every verify above are unchanged.
