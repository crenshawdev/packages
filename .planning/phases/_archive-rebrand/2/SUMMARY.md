---
phase: 2
status: complete
completed: 2026-07-13
---

# Phase 2: Assets & build integrity - Summary

Regenerated the Tempest OG card at the live v2.11.0, cleared the last old-brand string from the orphan `og-image.svg`, bumped the social-card cache-buster, and confirmed a clean production build with no leakage outside the locked D-05 carve-out.

## What shipped

- Tempest OG card at `version: 2.11.0` - `og/tempest-card.html:226` (template) and regenerated `public/tempest-og.png`.
- Identity-clean orphan SVG - `public/og-image.svg:53` footer now reads `john · retired` (was `blog.vintagetechie.com`).
- Cache-buster `?v=2026-07` so Facebook/Mastodon re-fetch the new cards - `src/layouts/BaseLayout.astro` (default + doc comment), `src/pages/code/tempest.astro`, `src/pages/code/weathervane.astro`.
- Verified-clean build - `npm run build` exits 0; `dist/` leakage grep isolates only the 4 D-05 tempest-install lines; zero lowercase `gitlab`; internal hrefs extensionless and trailing-slash-free. (`dist/` is a gitignored build artifact - CI rebuilds it, so no commit.)

## Commits

| Plan | Task | Commit | Description |
|---|---|---|---|
| 1 | 1 | ff8421d | Bump Tempest OG card version 2.9.0 -> 2.11.0 (`og/tempest-card.html:226`) |
| 1 | 2 | 4398765 | Regenerate `public/tempest-og.png` from the bumped template (ad-hoc Playwright; `package.json`/lock unchanged) |
| 1 | 3 | 2511877 | Replace old-brand footer in `public/og-image.svg` with `john · retired` |
| 1 | 4 | e870f8e | Bump OG cache-buster `?v=2026-06` -> `?v=2026-07` across 3 files |

Tasks 5 (build) and 6 (leakage/routing inspection) produced no commit - `dist/` is gitignored and both are verify-only.

## Deviations

None - plans executed as written. `public/og-image.png` and `public/weathervane-og.png` re-rendered byte-identical (only the tempest template changed), so only `tempest-og.png` needed committing.

## Open items

- On-page hardcoded version badge `v2.9.0` at `src/pages/code/tempest.astro:20` is stale against live v2.11.0. Explicitly out of Phase 2 scope (CONTEXT names only the OG card; IDENT-03/BLD-01 govern OG assets, not on-page display) - flagged for a separate decision.
- OG cards are point-in-time snapshots: `2.11.0` will go stale on the next Tempest release (accepted, user's call).

## Goal check

The four commits plausibly deliver the phase goal. IDENT-03 and BLD-01 are met: all three OG PNGs are identity-clean (visually verified, no `vintagetechie` mark), the tempest card now shows the live version, the last SVG leak is gone, and the regenerated PNG is committed under `public/` with the cache-buster bumped so downstream caches refresh. BLD-02 is met: `npm run build` exits 0, the built `dist/` surfaces `vintagetechie` only in the locked D-05 tempest-install block, carries zero lowercase `gitlab`, and its internal links are extensionless and trailing-slash-free. Nothing within the phase's OG-asset/build scope is missing; the only stale identifier left is the out-of-scope on-page version badge noted above.
