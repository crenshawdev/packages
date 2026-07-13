---
phase: 1
plan: 1
requirements: [SSR-01, SSR-02]
files:
  - astro.config.mjs
  - package.json
  - package-lock.json
  - src/lib/content.ts
  - src/pages/index.astro
  - src/pages/writing.astro
  - src/pages/rss.xml.ts
  - src/pages/about.astro
  - src/pages/posts/[slug].astro
---

# Phase 1: Astro SSR foundation - Plan

## Goal

The front end runs in server output with an @astrojs/node standalone adapter, reads
content through a single `src/lib` data-source abstraction, and renders the existing design
and every page identically, with content still sourced from the markdown glob.

## Must be true when done

- `astro.config.mjs` declares `output: 'server'` and the `@astrojs/node` adapter in
  `standalone` mode, and `@astrojs/node` is a dependency in `package.json`.
- `npm run build` exits 0 and produces a server build; starting that server serves `/`,
  `/writing`, `/about`, `/code`, a `/posts/<slug>`, and `/rss.xml` each returning HTTP 200.
- A post page rendered on-demand shows the same title, body text, and newer/older
  navigation targets it showed before the conversion, resolved from `Astro.params.slug`
  with no `getStaticPaths`.
- No `.astro` page or `.ts` endpoint under `src/pages` imports `getCollection`, `getEntry`,
  or `render` from `astro:content`; every content read goes through `src/lib/content.ts`.
- `/rss.xml` returns well-formed XML whose `<item>` link slugs match the published-post
  list shown on `/writing`.

## Context

- Locked decisions (CONTEXT.md D-01..D-05): `output: 'server'` with all pages on-demand (no
  `prerender` opt-ins); `@astrojs/node` in `mode: 'standalone'`; one `src/lib` module owning
  the shared published filter plus a `renderBody()` helper with no page importing
  `astro:content`; `posts/[slug].astro` drops `getStaticPaths` and resolves from
  `Astro.params.slug`; `rss.xml.ts` stays an `@astrojs/rss` `GET` endpoint through the module.
- Content is markdown this phase. The glob loader assigns each entry's `id` from its
  frontmatter `slug` (verified: `getEntry('posts','about')` resolves `posts/page-about.md`,
  whose `slug: about`), so an entry's `id` equals its published slug.
- The shared published filter (duplicated today at index.astro:9, writing.astro:7,
  rss.xml.ts:10, [slug].astro:8) is `type === 'post' && status !== 'draft' &&
  visibility !== 'private'`, sorted by `published_at` descending.
- Out of scope: Ghost, Content API, webhooks, Coolify, in-pipeline OG regen, any design or
  copy change. `og/render-og.mjs` and the `src/pages/code/*` project pages are untouched.
  `src/lib/latestCode.ts` (GitHub release fetch) is unchanged.

## Tasks

### Task 1: Convert to server output with the Node standalone adapter

- **Files:** astro.config.mjs, package.json, package-lock.json
- **Action:** Run `npx astro add node --yes` to install `@astrojs/node` at a version
  compatible with the pinned Astro 6 and wire it into the config. Then ensure
  `astro.config.mjs` reads `output: 'server'` and `adapter: node({ mode: 'standalone' })`
  (import `@astrojs/node`), keeping the existing `site`, `trailingSlash: 'never'`,
  `build.format: 'directory'`, and `fonts` blocks intact. Do NOT add any `prerender` exports
  anywhere and do not add per-page prerender opt-ins. If `astro add` resolves an
  `@astrojs/node` version incompatible with the pinned Astro, pin `@astrojs/node` manually to
  the matching major in `package.json` and reinstall. Do not touch any page files in this task.
- **Verify:** `npm run build` exits 0 and creates `dist/server/entry.mjs`; `grep "output: 'server'"
  astro.config.mjs` and `grep "standalone" astro.config.mjs` both match; `@astrojs/node`
  appears under `dependencies` in `package.json`.

### Task 2: Create the src/lib data-source module

- **Files:** src/lib/content.ts
- **Action:** Create `src/lib/content.ts` as the sole owner of `astro:content` access for
  content pages. Define an exported `Post` interface with fields `id: string`, `slug: string`,
  `title: string`, `body: string`, `excerpt: string | null`, `metaDescription: string | null`,
  `publishedAt: Date`, `tags: string[]`. Add a private `isPublished` predicate implementing the
  shared filter (`type === 'post' && status !== 'draft' && visibility !== 'private'`) and a
  private `toPost` mapper (`id` = `entry.id`; `title` = `data.title`;
  `slug` = `data.slug ?? entry.id`; `body` = `entry.body ?? ''`;
  `excerpt` = `data.excerpt ?? null`; `metaDescription` = `data.meta_description ?? null`;
  `publishedAt` = `data.published_at`; `tags` = `data.tags ?? []`). Export
  `getPublishedPosts(): Promise<Post[]>` = `getCollection('posts')` filtered by `isPublished`,
  sorted by `publishedAt` descending, mapped through `toPost`. Export
  `getPostBySlug(slug: string): Promise<Post | undefined>` that finds within
  `getPublishedPosts()` by `slug`. Export `renderBody(id: string)` that calls
  `getEntry('posts', id)` and returns `await render(entry)` (the `{ Content }` result),
  throwing if the entry is missing. This is the only file permitted to import from
  `astro:content` besides `src/content.config.ts`.
- **Verify:** `grep -c "astro:content" src/lib/content.ts` returns 1; `grep -E
  "getPublishedPosts|getPostBySlug|renderBody" src/lib/content.ts` shows all three exports.
  Full type compilation is exercised when the module is consumed in Tasks 3-5.

### Task 3: Route the list consumers (index, writing, rss) through the module

- **Files:** src/pages/index.astro, src/pages/writing.astro, src/pages/rss.xml.ts
- **Action:** In all three, remove the `import { getCollection } from 'astro:content'` line
  and the inline filter/sort, and import `getPublishedPosts` from `../lib/content` (rss.xml.ts
  uses `../lib/content`). Replace each `await getCollection('posts')...filter...sort` block
  with `const posts = await getPublishedPosts();`. Update every field reference to the flat
  `Post` shape: `p.data.title` -> `p.title`, `p.data.published_at` -> `p.publishedAt`,
  `p.data.slug ?? p.id` -> `p.slug`, `p.data.tags?.[0]` -> `p.tags[0]`, `p.data.excerpt ??
  p.data.meta_description` -> `p.excerpt ?? p.metaDescription`, and `p.body`/`latest.body`
  stay as `.body`. Keep all read-time, word-count, excerpt, date-format, and grouping logic
  and all markup byte-for-byte otherwise; do not alter the boot overlay, styles, or copy.
  Leave the `getLatestCode()` usage in index.astro unchanged.
- **Verify:** `grep -rn "astro:content" src/pages/index.astro src/pages/writing.astro
  src/pages/rss.xml.ts` returns nothing; after `npm run build` and starting the server
  (`HOST=127.0.0.1 PORT=4321 node ./dist/server/entry.mjs`), `curl -s -o /dev/null -w "%{http_code}"
  http://127.0.0.1:4321/` and `.../writing` and `.../rss.xml` each print `200`, `/writing`
  lists the same entry count as before, and `/rss.xml` is well-formed XML.

### Task 4: Route the about page through renderBody

- **Files:** src/pages/about.astro
- **Action:** Remove `import { getEntry, render } from 'astro:content'` and the
  `getEntry`/`render` calls. Import `renderBody` from `../lib/content` and set
  `const { Content } = await renderBody('about');`. Leave the layout props, the
  `room-head`/`prose` markup, and the static `worklog` section unchanged.
- **Verify:** `grep -n "astro:content" src/pages/about.astro` returns nothing; with the
  server running, `curl -s http://127.0.0.1:4321/about` returns HTTP 200 and its `<div
  class="prose">` contains the about body text ("almost none of it was ever mine to keep").

### Task 5: Refactor posts/[slug] onto Astro.params.slug and the module

- **Files:** src/pages/posts/[slug].astro
- **Action:** Delete the entire `getStaticPaths` function and the `astro:content` import. In
  the frontmatter, read `const slug = Astro.params.slug;`, load `const posts = await
  getPublishedPosts();` (import from `../../lib/content`), find `const i = posts.findIndex((p)
  => p.slug === slug);`, and if `i === -1` return `new Response(null, { status: 404 })`.
  Derive `const post = posts[i]`, `const newer = posts[i - 1] ?? null`, `const older =
  posts[i + 1] ?? null`, `const index = posts.length - i;` (preserving the current
  neighbor/index semantics from getStaticPaths). Render with `const { Content } = await
  renderBody(post.id);`. Update field references to the flat shape: `post.data.title` ->
  `post.title`, `post.data.excerpt ?? post.data.meta_description` -> `post.excerpt ??
  post.metaDescription`, `post.data.published_at` -> `post.publishedAt`, `post.data.tags?.[0]`
  -> `post.tags[0]`, `post.body` -> `post.body`, and in the footer
  `newer.data.slug ?? newer.id` -> `newer.slug`, `newer.data.title` -> `newer.title`, same for
  `older`. Keep the byline, eyebrow, prose, and post-foot markup otherwise unchanged.
- **Verify:** `grep -n "getStaticPaths\|astro:content" src/pages/posts/[slug].astro` returns
  nothing and the file references `Astro.params.slug`; with the server running, `curl -s
  http://127.0.0.1:4321/posts/<slug>` for a real published slug returns HTTP 200 with the
  post title in `<h1>` and its body in `.prose`, and the `post-foot` "next"/"previous" link
  points to the adjacent slug in the `/writing` published order; an unknown slug returns 404.

## Notes

- Assumption (from CONTEXT, low risk): `astro add node` selects a Node-adapter version
  compatible with the pinned Astro 6; Task 1 pins manually if it does not.
- The standalone server defaults to `HOST`/`PORT` env vars; verifications use
  `HOST=127.0.0.1 PORT=4321` and `dist/server/entry.mjs`.
