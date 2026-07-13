---
status: complete
phase: 1
sources: [CONTEXT.md, SUMMARY.md]
started: 2026-07-13
updated: 2026-07-13
---

## Items

### 1. Cold-start smoke test
expected: From a clean state (`rm -rf dist`), `npm run build` completes and starting the server (`HOST=127.0.0.1 PORT=4321 node ./dist/server/entry.mjs`) boots without error and `/` returns HTTP 200 with real rendered content (latest essay present).
status: pass
source: verifier
evidence: `rm -rf dist && npm run build` ended `[build] Complete!`, `dist/server/entry.mjs` created; server logged `Server listening`; `/` -> 200, `<title>John Crenshaw</title>`, 22390-byte body.

### 2. Server output + Node standalone adapter configured
expected: `astro.config.mjs` declares `output: 'server'` and `adapter: node({ mode: 'standalone' })`, and `@astrojs/node` is a dependency in `package.json`.
status: pass
source: verifier
evidence: astro.config.mjs:6 `output: 'server'`, :7 `adapter: node({ mode: 'standalone' })`, :2 imports `@astrojs/node`; package.json dependencies `"@astrojs/node": "^10.1.4"`.

### 3. Build succeeds and every route serves 200
expected: `npm run build` exits 0 and produces a server build; the running server serves `/`, `/writing`, `/about`, `/code`, a `/posts/<slug>`, and `/rss.xml`, each returning HTTP 200.
status: pass
source: verifier
evidence: Route sweep `/`=200 `/writing`=200 `/about`=200 `/code`=200 `/rss.xml`=200 `/posts/ai-is-not-the-enemy-...`=200.

### 4. Post page render parity
expected: For a real published slug, the SSR post page shows the same title, body text, and newer/older navigation targets as the pre-conversion static build (no visible content or layout change).
status: pass
reported: "looks identical, mark it passed"
note: Structure/content/routing machine-verified by cad-verifier; visual/design parity confirmed by John against the running standalone SSR server (`/`, `/writing`, `/about`, `/code`, a post) - identical.

### 5. Single data-source abstraction
expected: No `.astro` page or `.ts` endpoint under `src/pages` imports `getCollection`, `getEntry`, or `render` from `astro:content`; every content read goes through `src/lib/content.ts`.
status: pass
source: verifier
evidence: `grep -rn "astro:content" src/pages/` empty; `grep -rln "astro:content" src/` returns only `src/lib/content.ts` and `src/content.config.ts`; all five pages import from `../lib/content`.

### 6. Post route is on-demand via Astro.params.slug
expected: `src/pages/posts/[slug].astro` contains no `getStaticPaths` and resolves the post from `Astro.params.slug`; an unknown slug returns 404.
status: pass
source: verifier
evidence: [slug].astro:5 `Astro.params.slug`, :7-10 findIndex + `return new Response(null, { status: 404 })`, no `getStaticPaths`; `/posts/this-slug-does-not-exist-xyz` -> 404.

### 7. RSS parity
expected: `/rss.xml` returns well-formed XML whose `<item>` link slugs match the published-post list shown on `/writing`.
status: pass
source: verifier
evidence: `xmllint --noout` WELL-FORMED OK; 18 `<item>` elements; RSS post slugs vs `/writing` post slugs identical set (18 each).

## Summary

total: 7
passed: 7
failed: 0
pending: 0
skipped: 0
blocked: 0
