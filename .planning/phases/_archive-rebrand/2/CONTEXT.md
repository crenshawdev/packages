# Phase 2: Assets & build integrity - Context

Gathered: 2026-07-13
Feeds: /cad-plan 2

## Scope boundary

In: Bump the tempest OG card version and regenerate all three OG PNGs from the
already-rebranded `og/*.html` templates; fix the one residual old-brand string in the
orphan `public/og-image.svg`; verify a full production build is clean (no old-brand
leakage outside the locked carve-out) with extensionless, trailing-slash-free routing.
Out: Any change to routing/link generation (already correct); the tempest install
`<pre><code>` block (Phase 1 D-05 carve-out, still legitimately `vintagetechie`); adding
playwright to `package.json`; deploy/staging/apex work (Phase 3).
Deferred: None.
Plan shape: one plan (one template version edit, re-render + commit 3 PNGs, one SVG
one-line edit, verification greps).

## Decisions

- D-01 (OG PNG cards): All three committed PNGs (`public/og-image.png`,
  `tempest-og.png`, `weathervane-og.png`) are already identity-clean, and `og/*.html`
  templates carry zero `vintagetechie`/`gitlab` strings. Bump `og/tempest-card.html:226`
  (`version: 2.9.0` -> `v2.11.0`) to match live Tempest, then re-render all three via
  `node og/render-og.mjs` (install playwright + chromium locally, ad-hoc, NOT added to
  `package.json` - CI never runs the render), and commit the regenerated PNGs under
  `public/`. Evidence: visual read of all 3 PNGs, `grep og/*.html`,
  `og/tempest-card.html:226`, `og/render-og.mjs:12-16`, CLAUDE.md OG gotcha.
- D-02 (og-image.svg orphan): Fix `public/og-image.svg:53` in place - replace
  `blog.vintagetechie.com` with `john · retired` (mirrors the PNG card's top-right tag;
  the left footer at `:50` already reads `jcrenshaw.dev`). Keep the file: nothing in
  `src/` references it (site cards use the PNGs), but Astro ships everything in `public/`
  into `dist/` and roadmap SC1 requires the SVG present and identity-clean. Evidence:
  `public/og-image.svg:47-53`, `grep -rn og-image src/` (only PNG refs in
  `BaseLayout.astro:40`, `tempest.astro:11`, `weathervane.astro:11`).
- D-03 (Leakage carve-out): After the SVG fix, the only remaining `vintagetechie` in
  `dist/` is the 4 D-05 tempest-install lines in `dist/code/tempest/index.html` (Flatpak
  app ID `com.vintagetechie.CosmicExtAppletTempest` + keyring/repo filenames) - the
  locked Phase-1 carve-out, which must NOT be "fixed." Zero `gitlab` leakage. This
  defines the leakage-grep pass condition. Evidence: `grep -rn vintagetechie dist/`,
  Phase 1 CONTEXT.md D-05.
- D-04 (Build & routing already clean): `npm run build` exits 0; built internal links
  are already extensionless and trailing-slash-free (`astro.config.mjs`
  `trailingSlash:'never'`, `build.format:'directory'`, locked Phase 1); RSS title is
  "John Crenshaw — Writing"; no sitemap integration. Phase 2 verifies these hold; it does
  not change routing or link generation. Evidence: `dist/**/*.html` scan,
  `astro.config.mjs`, `src/pages/rss.xml.ts:14`.

## Acceptance criteria

- [ ] Reading `public/tempest-og.png` shows `version: 2.11.0` and the JC / jcrenshaw.dev
      identity; `public/og-image.png` and `public/weathervane-og.png` show the JC
      identity with no `vintagetechie` mark; all three are committed under `public/`.
- [ ] `grep -n "blog.vintagetechie.com" public/og-image.svg` returns no match; the file
      still exists with footer reading `jcrenshaw.dev` (left) and `john · retired` (right).
- [ ] `npm run build` exits 0.
- [ ] `grep -rn "vintagetechie" dist/` matches ONLY `dist/code/tempest/index.html` (the
      D-05 install lines); no other file, and zero `gitlab` matches.
- [ ] Spot-checking `dist/index.html` shows internal hrefs are extensionless and
      trailing-slash-free.

## Flagged assumptions

- OG cards are point-in-time static snapshots; bumping tempest to `v2.11.0` fixes today's
  staleness but the card goes stale again on the next Tempest release (accepted, user's
  call).
- The OG image URLs carry a `?v=2026-06` cache-buster (`BaseLayout.astro:40`,
  `tempest.astro:11`, `weathervane.astro:11`). Since the regenerated tempest card changes
  content, the planner should decide whether to bump `?v=` so social/CDN caches re-fetch
  the new card. HOW detail left to /cad-plan.
