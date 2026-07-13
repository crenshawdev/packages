# Phase 1: Astro SSR foundation - Context

Gathered: 2026-07-13
Feeds: /cad-plan 1

## Scope boundary

In: Convert Astro from its static default to `output: 'server'` with the `@astrojs/node`
standalone adapter (all pages on-demand). Introduce a single `src/lib` data-source module
that owns the published-post filter and returns plain post data plus a `renderBody()`
wrapper; route all five content call sites (`index`, `writing`, `about`, `posts/[slug]`,
`rss.xml`) through it so no page imports `astro:content` directly. Refactor
`posts/[slug].astro` off `getStaticPaths` to resolve the post from `Astro.params.slug` and
derive newer/older navigation in the page body. Content stays markdown-backed this phase.

Out: Ghost, the Content API, webhooks, Coolify deploy, in-pipeline OG regeneration, any
design or copy change. The OG script (`og/render-og.mjs`) is untouched (in-pipeline OG is
Phase 4).

Deferred: None.

Plan shape: one plan.

## Decisions

- D-01 (Rendering mode): Use `output: 'server'` with every page rendered on-demand (no `prerender` opt-ins). Chosen over the hybrid prerender path to match SSR-01 and the decided dynamic direction, and to keep the tabled paid-members path a switch-flip. Evidence: `astro.config.mjs` sets no `output` (Astro static default); Astro 6 docs — `output: 'server'` is on-demand by default.
- D-02 (Adapter): Install `@astrojs/node` in `mode: 'standalone'` via `astro add node`, so the adapter version is pinned compatible with Astro 6.4.8 and the server self-starts for Coolify/Docker. Evidence: adapter absent from `package-lock.json`; Astro node-adapter docs (`astro add node`, standalone = self-starting server).
- D-03 (Data abstraction): One new module under `src/lib/` returns plain published-post data plus a `renderBody()` helper and owns the shared published filter (`type === 'post' && status !== 'draft' && visibility !== 'private'`, sorted by `published_at`). Pages never import `astro:content` directly. Chosen for the cleanest Phase 3 markdown→Ghost swap (one file changes). Evidence: identical filter duplicated at `index.astro:9`, `writing.astro:7`, `rss.xml.ts:10`, `[slug].astro:8` (rss comments that it must match index); `render()`/`<Content />` at `about.astro:6`, `[slug].astro:23`; `src/lib/latestCode.ts` sets the `src/lib` helper precedent.
- D-04 (Dynamic route): `posts/[slug].astro` drops `getStaticPaths`; it reads `Astro.params.slug`, looks the post up through the module, and derives newer/older/index from the full sorted list in the page body. Evidence: `posts/[slug].astro:5-20` currently builds params + neighbor props inside `getStaticPaths`; on-demand routes do not call it.
- D-05 (RSS/OG scope): `rss.xml.ts` stays an `@astrojs/rss` `GET` endpoint, now consuming content through the module and served on-demand; `og/render-og.mjs` is unchanged this phase. Evidence: `rss.xml.ts:1-24`, `og/render-og.mjs:1-39`, `CLAUDE.md` (CI does not run render-og; PNGs committed).

## Acceptance criteria

- [ ] `astro.config.mjs` declares `output: 'server'` and the `@astrojs/node` adapter in `standalone` mode, and `@astrojs/node` is a dependency in `package.json`.
- [ ] `npm run build` exits 0 and produces a server build; starting that server serves `/`, `/writing`, `/about`, `/code`, a `/posts/<slug>`, and `/rss.xml` each returning HTTP 200.
- [ ] For a given post slug, the SSR-rendered post page shows the same title, body text, and newer/older navigation targets as the pre-conversion static build.
- [ ] No `.astro` page or `.ts` endpoint imports `getCollection`, `getEntry`, or `render` from `astro:content`; every content read goes through the single `src/lib` data-source module.
- [ ] `posts/[slug].astro` contains no `getStaticPaths` and resolves the post from `Astro.params.slug`.
- [ ] `/rss.xml` returns well-formed XML whose `<item>` slugs match the published-post list shown on `/writing`.

## Flagged assumptions

- `astro add node` selects the adapter version for Astro 6.4.8; if it resolves a version incompatible with the pinned Astro, the plan pins `@astrojs/node` manually. Low risk.
- On-demand SSR adds per-request origin load on the 4GB droplet; the Cloudflare Pro edge-cache strategy is validated in the deploy/automation phases, not here.
