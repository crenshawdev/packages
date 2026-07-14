---
status: complete
phase: 3
sources: [CONTEXT.md, PLAN.md + ROADMAP.md, SUMMARY.md]
started: 2026-07-13
updated: 2026-07-13
---

## Items

### 1. Content source is Ghost, not astro:content
expected: `grep -rn astro:content src/` returns zero hits and `src/content.config.ts` is gone; content in `src/lib/content.ts` is fetched over HTTP from `GHOST_URL`.
status: pass
source: verifier
evidence: `grep -rn astro:content src/` -> zero hits (exit 1); `src/content.config.ts` absent; `content.ts:49-57` fetchGhost raw-fetches `${GHOST_URL}/ghost/api/content/...`, env from `astro:env/server`.

### 2. All five routes 200 with Ghost content
expected: With the dev server up, `/`, `/writing`, a `/posts/<slug>`, `/about`, and `/rss.xml` each return HTTP 200; `/writing` lists 18 posts; `/about` renders the Ghost page body (e.g. contains `EAS Technologies`).
status: pass
evidence: all 5 routes -> 200; `/writing` shows 18 entry-title occurrences / 18 distinct /posts/ slugs / "18 entries" label; `/about` contains `EAS Technologies`.

### 3. Post render parity, no mapping artifacts
expected: A chosen post (e.g. `the-last-default`) shows the same title, body prose, tag eyebrow, filed date, read-time byline, and newer/older nav as the markdown build - no `NaN` dates, no `[object Object]` tags.
status: pass
evidence: `/posts/the-last-default`: h1 "The Last Default"; eyebrow "no.18 · linux"; body prose "kernel panicked" present; `7 min` byline; newer/older nav present; grep NaN=0, [object Object]=0.

### 4. RSS parity
expected: `/rss.xml` is well-formed XML with 18 `<item>` elements whose slugs match the `/writing` links, with the hand-written excerpts as `<description>`.
status: pass
evidence: xmllint OK; 18 `<item>`; item /posts/ slugs diff vs /writing = IDENTICAL (18/18); item descriptions carry hand-written excerpts (e.g. the-last-default "...kernel panicked...").

### 5. Per-post og:image from Ghost feature image
expected: `/posts/death-by-yes` emits its Ghost `feature_image` URL as `og:image`; `/posts/the-last-default` (no feature image) falls back to `/og-image.png`.
status: pass
evidence: death-by-yes og:image=`https://ghost.jcrenshaw.dev/content/images/2026/07/orjeYhi09ZQ-unsplash.jpg`; the-last-default og:image=`https://jcrenshaw.dev/og-image.png?v=2026-07`.

### 6. Build passes
expected: `npm run build` exits 0.
status: pass
source: verifier
evidence: `npm run build` -> EXIT:0, log ends `[build] Complete!` (SSR output:'server', no Ghost fetch at build time).

## Summary

total: 6
passed: 6
failed: 0
pending: 0
skipped: 0
blocked: 0
