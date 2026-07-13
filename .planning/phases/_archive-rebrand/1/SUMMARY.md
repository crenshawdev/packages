---
phase: 1
status: complete
completed: 2026-07-13
---

# Phase 1: Rebrand source & identity - Summary

Rebranded the Astro source from vintagetechie to John Crenshaw / `crenshawdev` /
`jcrenshaw.dev`, repointed the version fetch to a GitHub tags+commit path rendering
live `v2.11.0` with its release date, and removed the parked Subscribe UI.

## What shipped

- GitHub-backed release fetch - `src/lib/latestCode.ts` (tags?per_page=1 then the
  per-commit endpoint for the committer date; `FALLBACK` now `v2.11.0`)
- Rebranded identity + repointed links on home and code-list pages -
  `src/pages/index.astro`, `src/pages/code.astro`
- Repointed project-page source/releases links to GitHub -
  `src/pages/code/tempest.astro`, `src/pages/code/weathervane.astro`
- Repointed the `/about` body repo link to `github.com/crenshawdev` -
  `posts/page-about.md`
- Subscribe import + render removed (component/CSS left orphaned per D-06) -
  `src/pages/posts/[slug].astro`
- In-repo identity docs updated - `PRODUCT.md`, `CLAUDE.md`

## Commits

| Plan | Task | Commit | Description |
|---|---|---|---|
| 1 | 1 | 7e46fd6 | Repoint `latestCode.ts` to the GitHub tags+commit API; `FALLBACK` → `v2.11.0` |
| 1 | 2 | 8d47915 | Rebrand identity + repoint links on home and code pages |
| 1 | 3 | 38cc477 | Repoint tempest/weathervane source links to GitHub (install block untouched, D-05) |
| 1 | 4 | 20c88ea | Repoint about-page body repo link to GitHub (D-02) |
| 1 | 5 | 21592e1 | Remove Subscribe import + render from the post template (D-06) |
| 1 | 6 | 771a9ea | Update in-repo identity docs to jcrenshaw.dev |

## Deviations

- [deviation] `node_modules` was absent, so build/preview verification could not run.
  The executor ran `npm ci` to restore the declared tree from the committed
  `package-lock.json` (a build-setup restore, not a dependency add) to exercise the
  live GitHub API path and rendered-output checks. No dependency versions changed;
  no files committed. npm blocked esbuild/sharp install scripts by policy; the Astro
  build completed clean regardless.

## Open items

- Three historical posts (`still-skidding-broadside`,
  `why-i-started-writing-rust-in-retirement`, `why-i-left-github`) still contain the
  string `VintageTechie` in essay body prose (historical Codeberg references). Out of
  scope per D-01 (historical narration left factual); flagged for visibility, not a
  regression.
- The tempest install `<pre><code>` block (`src/pages/code/tempest.astro` ~36-49)
  retains `vintagetechie.*` strings by design (D-05 carve-out; self-hosted
  distribution infra not yet built). Revisit when that infra ships.

## Goal check

The six commits plausibly deliver the phase goal. `latestCode.ts` now reads live
release data from GitHub (`crenshawdev/tempest`) and renders `v2.11.0` with its
release date rather than the hardcoded fallback; every current-identity surface
(titles, descriptions, bylines, links, boot log) is rebranded to
`crenshawdev`/`jcrenshaw.dev`; the Subscribe UI is imported and rendered on zero
pages; and the phase-level check `grep -rn "vintagetechie" src/` matches only the
intentional D-05 install-block carve-out. The advisory diff review returned zero
findings and live-verified the endpoints and links. Nothing required for the goal
is missing; the only residual old-brand strings are the two documented carve-outs
above.
