---
status: complete
phase: 1
sources: [CONTEXT.md, SUMMARY.md]
started: 2026-07-13
updated: 2026-07-13
---

## Items

### 1. No old-brand strings in the source
expected: `grep -rn "vintagetechie" src/` returns matches ONLY inside the deferred tempest install `<pre><code>` block (`src/pages/code/tempest.astro` ~36-49); every other current-identity surface (titles, bylines, metadata, nav, footer, links, alt text) is clean.
status: pass
source: verifier
evidence: `grep -rn "vintagetechie" src/` → only `src/pages/code/tempest.astro:40,43,44,48`, all inside the D-05 install block (lines 35-49).

### 2. John Crenshaw byline and jcrenshaw.dev metadata site-wide
expected: `npm run preview` shows the "John Crenshaw" byline and `jcrenshaw.dev` canonical/OG metadata on the home, writing, about, and code pages, with no "(VintageTechie)" in any page description.
status: pass
source: verifier
evidence: `BaseLayout.astro:23` `siteTitle='John Crenshaw'`; canonical/OG derive from `Astro.site`=`https://jcrenshaw.dev` (`astro.config.mjs:4`); built `dist/code/index.html` shows `canonical href="https://jcrenshaw.dev/code"`, `og:site_name="John Crenshaw"`; no "(VintageTechie)" in index/writing/about/code descriptions.

### 3. Live GitHub release version with date
expected: `latestCode.ts` fetches `crenshawdev/tempest` from the GitHub API; the home and code pages render a live version (`v2.11.0`) WITH the release date, not the hardcoded fallback; the `FALLBACK` constant reads `v2.11.0`.
status: pass
source: verifier
evidence: `src/lib/latestCode.ts` tags→commit path, both fetches use User-Agent + `Accept: application/vnd.github+json` + `AbortSignal.timeout(8000)`, `res.ok` checked on both (:29,:43), `FALLBACK`=`v2.11.0` (:14). Build: no fallback warning; `dist/index.html:16` renders `v2.11.0` + `Latest release · Jul 10, 2026` + live badge; `dist/code/index.html` renders `v2.11.0 · Jul 2026`.

### 4. All repo/source/releases links point to GitHub
expected: Every rendered source/releases/repo link resolves to `github.com/crenshawdev/...` (or weathervane's crates.io/docs.rs links); no `gitlab.com/vintagetechie` link renders on any page, including `/about`.
status: pass
source: verifier
evidence: `grep -rin gitlab src/ posts/page-about.md` → nothing; `grep -rn gitlab.com dist/` → none (excl. gitlab-ci); tempest source/releases, weathervane, powercurve, code footer all github.com/crenshawdev; `dist/about/index.html:7` → "The code lives on GitHub" href github.com/crenshawdev.

### 5. Subscribe component rendered nowhere
expected: `grep -rn "Subscribe" src/pages/` shows no import or render of the Subscribe component on any page (the component + CSS stay orphaned in `src/components/` and `global.css`).
status: pass
source: verifier
evidence: `grep -rn Subscribe src/pages/` → nothing; `grep -rln Subscribe src/` → `src/components/Subscribe.astro`, `src/styles/global.css` (both preserved).

### 6. In-repo identity docs rebranded
expected: `PRODUCT.md` and `CLAUDE.md` carry no present-tense `vintagetechie` identity reference (the `.gitlab-ci.yml` filename in CLAUDE.md is a real file, kept).
status: pass
source: verifier
evidence: `grep -in vintagetechie PRODUCT.md CLAUDE.md` → nothing; `CLAUDE.md:19` retains the legitimate `.gitlab-ci.yml` filename reference.

## Summary

total: 6
passed: 6
failed: 0
pending: 0
skipped: 0
blocked: 0
