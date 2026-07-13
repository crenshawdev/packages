---
phase: 1
status: complete
completed: 2026-07-13
---

# Phase 1: Astro SSR foundation - Summary

The site now builds and runs in server output behind the `@astrojs/node` standalone adapter, with every content read routed through a single `src/lib/content.ts` data-source abstraction while content stays sourced from the markdown glob.

## What shipped

- Server output + Node adapter - `astro.config.mjs` (`output: 'server'`, `adapter: node({ mode: 'standalone' })`); `@astrojs/node@10.1.4` in `package.json`
- Data-source abstraction - `src/lib/content.ts`, exporting `Post`, `getPublishedPosts`, `getPostBySlug`, `renderBody`; sole owner of the published filter and the only content page importer of `astro:content`
- List consumers routed through the module - `src/pages/index.astro`, `src/pages/writing.astro`, `src/pages/rss.xml.ts`
- About page routed through `renderBody('about')` - `src/pages/about.astro`
- On-demand post route - `src/pages/posts/[slug].astro` resolves from `Astro.params.slug`, derives newer/older/index in the body, `getStaticPaths` removed, unknown slug returns 404

## Commits

| Plan | Task | Commit | Description |
|---|---|---|---|
| 1 | 1 | 37f851b | Convert to server output with the node standalone adapter |
| 1 | 2 | 325ed83 | Add `src/lib/content.ts` data-source abstraction |
| 1 | 3 | 113f6a3 | Route index, writing, and rss through `src/lib/content` |
| 1 | 4 | 162dbbc | Route about page through `src/lib/content` `renderBody` |
| 1 | 5 | 072f826 | Resolve `posts/[slug]` from `Astro.params.slug` |

## Deviations

- [deviation] Task 1 (37f851b): `npx astro add node --yes` tried to install `@astrojs/node@^11.0.2`, which peers on `astro: ^7.0.0` and fails ERESOLVE against the pinned Astro 6.4.8. Pinned `@astrojs/node@10.1.4` manually (peer `astro: ^6.3.0`) and wired `astro.config.mjs` by hand. This was the exact low-risk fallback the plan and CONTEXT.md anticipated.

## Open items

- `.gitlab-ci.yml` still does `npm run build` then `mv dist public`, which no longer produces static HTML under server output. Out of scope for this phase (render parity); the deploy path is Phase 4's concern (Coolify). Flagged so it is not forgotten before any deploy.

## Goal check

The sum of the five commits delivers the phase goal. Server output with the `@astrojs/node` standalone adapter is in place (37f851b), a single `src/lib/content.ts` abstraction owns the published filter and `renderBody` (325ed83), and all five content call sites - index, writing, rss, about, and the post route - read through it with no page importing `astro:content` directly (113f6a3, 162dbbc, 072f826). A clean build exits 0 with no warnings, the full route sweep (`/`, `/writing`, `/about`, `/code`, `/posts/<slug>`, `/rss.xml`) returns 200, RSS carries 18 items matching the published list, neighbor navigation matches the pre-conversion order, and content is still markdown-backed. SSR-01 and SSR-02 are both satisfied. Nothing about the goal looks missing; the only loose thread (GitLab CI deploy assumption) belongs to Phase 4.
