---
phase: 2
plan: 1
requirements: [IDENT-03, BLD-01, BLD-02]
files:
  - og/tempest-card.html
  - public/og-image.png
  - public/tempest-og.png
  - public/weathervane-og.png
  - public/og-image.svg
  - src/layouts/BaseLayout.astro
  - src/pages/code/tempest.astro
  - src/pages/code/weathervane.astro
---

# Phase 2: Assets & build integrity - Plan

## Goal

Social/OG assets reflect the new John Crenshaw / jcrenshaw.dev identity, and a full
production build is clean with no old-brand leakage outside the locked carve-out and
valid extensionless, trailing-slash-free routing.

## Must be true when done

- Reading `public/tempest-og.png` shows the Tempest card with `version: 2.11.0` and the
  JC / jcrenshaw.dev identity, no `vintagetechie` mark.
- Reading `public/og-image.png` and `public/weathervane-og.png` shows the JC identity
  with no `vintagetechie` mark; all three regenerated PNGs are present under `public/`.
- `public/og-image.svg` still exists, contains no `blog.vintagetechie.com`, and its
  footer reads `jcrenshaw.dev` (left) and `john · retired` (right).
- `npm run build` exits 0.
- `grep -rn "vintagetechie" dist/` matches ONLY the D-05 install lines in
  `dist/code/tempest/index.html`; no other file, and zero `gitlab` matches.
- Spot-checking `dist/index.html` shows internal hrefs are extensionless and
  trailing-slash-free.

## Context

Locked decisions from CONTEXT.md bind this plan: D-01 (bump tempest card version, ad-hoc
render, commit 3 PNGs), D-02 (fix the SVG in place), D-03 (leakage carve-out is the 4
D-05 tempest-install lines - must NOT be touched), D-04 (build/routing already correct,
verify only). The `og/*.html` templates are already identity-clean; only the tempest
version string is stale. Playwright must NOT be added to `package.json` (CI never runs
the render). Out of scope: routing/link generation, the tempest install `<pre><code>`
block, the on-page `v2.9.0` badge in `tempest.astro:20` (not an OG asset; CONTEXT names
only `og/tempest-card.html:226`), any Phase 3 deploy work.

## Tasks

### Task 1: Bump the Tempest OG card version to match live release

- **Files:** og/tempest-card.html
- **Action:** On line 226, replace the version ledger value `2.9.0` with `2.11.0` so the
  rendered card reads `version: 2.11.0`, matching the live Tempest release. Keep it
  unprefixed (no `v`) to match the card's other ledger rows (`status: live`,
  `license: gpl-3.0`) and CONTEXT acceptance criterion 1. Change only that one value;
  leave every other ledger row (status, license, install, panel, data) and all card
  markup untouched.
- **Verify:** `grep -n "2.11.0" og/tempest-card.html` returns the version row on line
  226, and `grep -n "2.9.0" og/tempest-card.html` returns no match.

### Task 2: Regenerate all three OG PNGs from the rebranded templates

- **Files:** public/og-image.png, public/tempest-og.png, public/weathervane-og.png
- **Action:** Install Playwright and Chromium ad-hoc without persisting to the repo:
  `npm install --no-save --no-package-lock playwright` then `npx playwright install
  chromium`. `--no-package-lock` keeps npm from mutating the tracked `package-lock.json`
  (CI runs `npm ci`, which hard-fails on a package.json/lockfile mismatch). The cards load
  IBM Plex from the Google Fonts CDN (`og/tempest-card.html:15`) and IBM Plex is not
  installed locally, so the render requires network access to `fonts.googleapis.com`; a
  blocked CDN silently falls back to DejaVu. Run `node og/render-og.mjs` to re-render all
  three cards to `public/` at 1200x630. Do NOT add `playwright` to `package.json`
  dependencies; if the install still writes to `package.json` or `package-lock.json`,
  revert those files (only the PNGs change). The renderer (`og/render-og.mjs`) already
  targets the three cards and output stems.
- **Verify:** Reading `public/tempest-og.png` shows `version: 2.11.0` with the JC /
  jcrenshaw.dev identity AND the ledger rendered in IBM Plex Mono (matching the existing
  committed card's typography, not a DejaVu fallback); reading `public/og-image.png` and
  `public/weathervane-og.png` shows the JC identity with no `vintagetechie` mark. Both
  `git status --short package.json` and `git status --short package-lock.json` report no
  change (only the three PNGs are modified).

### Task 3: Fix the residual old-brand string in the orphan OG SVG

- **Files:** public/og-image.svg
- **Action:** On line 53, replace the right-footer text content `blog.vintagetechie.com`
  with `john · retired` (mirrors the PNG card's top-right identity tag). Keep the file and
  the surrounding `<text>` element attributes; the left footer at line 50 already reads
  `jcrenshaw.dev` and stays as-is. Do not delete or otherwise alter the file.
- **Verify:** `grep -n "blog.vintagetechie.com" public/og-image.svg` returns no match;
  `grep -n "john · retired" public/og-image.svg` returns line 53; the file still exists
  with the left footer reading `jcrenshaw.dev`.

### Task 4: Bump the OG image cache-buster so caches re-fetch the new cards

- **Files:** src/layouts/BaseLayout.astro, src/pages/code/tempest.astro, src/pages/code/weathervane.astro
- **Action:** The tempest card art changed (version bump), and BaseLayout's own comment
  mandates bumping `?v=` when card art changes so Facebook/Mastodon re-fetch. Replace
  every `?v=2026-06` with `?v=2026-07` in these files: the default og-image URL in
  `BaseLayout.astro` (line 40) plus its doc-comment example (line 18), the `ogImage` prop
  in `tempest.astro` (line 11), and the `ogImage` prop in `weathervane.astro` (line 11).
  Change only the version token; leave the image paths unchanged.
- **Verify:** `grep -rn "v=2026-06" src/` returns no match; `grep -rn "v=2026-07" src/`
  returns four matches across the three files.

### Task 5: Produce a clean full production build

- **Files:** dist/ (generated output)
- **Action:** Run `npm run build` (Astro static build to `dist/`). This picks up the SVG
  fix and cache-buster edits. Do not change `astro.config.mjs`, routing, or link
  generation - `trailingSlash: 'never'` with `build.format: 'directory'` is already
  correct (D-04); this task only regenerates `dist/`.
- **Verify:** `npm run build` exits 0 with no error output.

### Task 6: Verify no old-brand leakage and correct routing in dist/

- **Files:** dist/ (read-only inspection)
- **Action:** Confirm the built output is identity-clean against the locked carve-out. Run
  `grep -rn "vintagetechie" dist/` and confirm every match is in
  `dist/code/tempest/index.html` (the 4 D-05 tempest-install lines: the Flatpak app ID
  `com.vintagetechie.CosmicExtAppletTempest` plus keyring/repo filenames) and nowhere
  else. Run `grep -rn "gitlab" dist/` (case-sensitive lowercase - the exempt IDENT-01
  essay prose capitalizes "GitLab", so a lowercase match isolates leakage) and confirm
  zero matches. Spot-check
  `dist/index.html` internal `href` values are extensionless and trailing-slash-free. Do
  NOT edit the tempest install block or any `dist/` file - this task only inspects; if a
  leak appears outside the carve-out, trace it to its `src/` origin and fix there, then
  rebuild.
- **Verify:** `grep -rn "vintagetechie" dist/` matches only `dist/code/tempest/index.html`;
  `grep -rn "gitlab" dist/` returns no match; internal hrefs in `dist/index.html` (e.g.
  `/writing`, `/code`, `/about`) carry no `.html` extension and no trailing slash.

## Notes

Playwright and its Chromium binary are installed ad-hoc for the render and are not
tracked in `package.json` - the GitLab CI build never runs `render-og.mjs`, so the
regenerated PNGs must be committed under `public/` (handled by the normal execution
commit flow). OG cards are point-in-time snapshots: `2.11.0` is correct as of this
phase and will go stale on the next Tempest release (accepted, user's call).
