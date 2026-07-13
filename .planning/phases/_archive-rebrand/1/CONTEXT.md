# Phase 1: Rebrand source & identity - Context

Gathered: 2026-07-13
Feeds: /cad-plan 1

## Scope boundary

In: Rebrand the residual current-identity strings and repo links across the Astro
source (`src/lib/latestCode.ts`, `src/pages/index.astro`, `src/pages/code.astro`,
`src/pages/code/tempest.astro`, `src/pages/code/weathervane.astro`, the About-page body
link in `posts/page-about.md`) plus in-repo identity docs (`PRODUCT.md`, `CLAUDE.md`);
rewrite `latestCode.ts` to fetch the latest Tempest release from the GitHub API
(`crenshawdev/tempest`) while preserving the release-date UI; remove the Subscribe render.
Out: OG/social asset regeneration (Phase 2 - IDENT-03/BLD-01); the tempest install-command
block; historical essay prose; distribution/newsletter/dashboard work.
Deferred: The tempest install `<pre><code>` block rebrand (Flatpak app ID
`com.vintagetechie.CosmicExtAppletTempest`, repo/keyring filenames `vintagetechie.*`, the
`dl.`/`pkg.jcrenshaw.dev` endpoints, and the AUR line) - the self-hosted distribution
infra is not built and identifiers are unchanged, so rebranding now would ship dead or
misbranded install commands. Belongs to the separate distribution project.
Plan shape: one plan (localized edits across ~7 files plus the latestCode rewrite).

## Decisions

- D-01 (Rebrand surface): The rebrand is a bounded set of per-file string edits, not a central-config change - the chrome already reads correctly. `BaseLayout.astro:23` sets `siteTitle = 'John Crenshaw'` driving `<title>`/`og:site_name`/`og:title`; canonical + OG/Twitter derive from `Astro.site` (`astro.config.mjs` `site: 'https://jcrenshaw.dev'`); `rss.xml.ts:14` title is `'John Crenshaw — Writing'`; `Panel.astro:10-12` and `Dock.astro:50` already show `jcrenshaw.dev` / `mailto:john@jcrenshaw.dev`. Residual current-identity strings to change: `src/lib/latestCode.ts`, `src/pages/index.astro`, `src/pages/code.astro`, `src/pages/code/tempest.astro`, `src/pages/code/weathervane.astro`; in-repo (IDENT-04, not rendered): `PRODUCT.md`, `CLAUDE.md`. Left as historical essay prose: `posts/2025-12-26-why-i-left-github.md`, `posts/2026-01-25-why-i-started-writing-rust-in-retirement.md`, `posts/2026-02-08-still-skidding-broadside.md`, `posts/2026-06-10-i-built-my-own-door.md`. Evidence: cad-assumptions-analyzer report, verified line cites above.
- D-02 (About link): `posts/page-about.md:19` renders a present-tense `gitlab.com/vintagetechie` repo link at `/about` (via `about.astro:5`); repoint to GitHub `crenshawdev`, matching the code pages - it is a live link, not historical narration. Evidence: `posts/page-about.md:19`, `src/pages/about.astro:5`.
- D-03 (latestCode GitHub swap): Fetch the newest tag from the GitHub tags endpoint (`/repos/crenshawdev/tempest/tags`), then fetch that tag's commit (`commit.url` / `/commits/{sha}`) for its committer date, memoized to keep build-time cost low, so the "Latest release · <date>" UI on `index.astro:151` and `code.astro` survives. GitHub publishes no Releases for tempest (`releases/latest` → 404), so the tags+commit path is required. Update the `FALLBACK` constant from `v2.9.5` to `v2.11.0`. Verified: `crenshawdev/tempest` public, latest tag `v2.11.0`. Evidence: `src/lib/latestCode.ts:6-7,15,25-32`, live GitHub API.
- D-04 (Repo links → GitHub): Repoint tempest source→`github.com/crenshawdev/tempest` and releases→`.../tempest/tags`; weathervane→`github.com/crenshawdev/weathervane`; powercurve→`github.com/crenshawdev/powercurve`. All three repos verified public via `gh repo view`. Evidence: `code.astro:29` (powercurve), `code/tempest.astro:55-56`, `code/weathervane.astro:41`, live GitHub.
- D-05 (Defer tempest install block): Do NOT touch the tempest install `<pre><code>` block (`tempest.astro:35-53`). The `dl.`/`pkg.jcrenshaw.dev` distribution endpoints are not built (confirmed with John), the Flatpak app ID and repo filenames still read `vintagetechie`, and rebranding now would ship broken/misbranded install commands. Only the source/releases links on that page are repointed. This is an explicit carve-out to IDENT-01. Evidence: `tempest.astro:35-53`, user confirmation.
- D-06 (Subscribe removal): Delete the import (`posts/[slug].astro:4`) and render (`:58`) only; leave `src/components/Subscribe.astro` and its CSS (`global.css:742-828`) orphaned in place for the parked-newsletter revival. Single call site confirmed by grep. Evidence: `src/pages/posts/[slug].astro:4,58`.

## Acceptance criteria

- [ ] `grep -rn "vintagetechie" src/` returns matches ONLY inside the deferred tempest install `<pre><code>` block; every other current-identity surface (titles, bylines, metadata, nav, footer, links, alt text) is clean.
- [ ] `npm run preview` shows the "John Crenshaw" byline and `jcrenshaw.dev` canonical/OG metadata on the home, writing, about, and code pages.
- [ ] `latestCode.ts` fetches `crenshawdev/tempest` from the GitHub API and the home and code pages render a live version (`v2.11.0`) WITH the release date, not the hardcoded fallback; the `FALLBACK` constant reads `v2.11.0`.
- [ ] Every rendered source/releases/repo link resolves to `github.com/crenshawdev/...` (or weathervane's crates.io/docs.rs links); no `gitlab.com/vintagetechie` link renders on any page, including `/about`.
- [ ] `grep -rn "Subscribe" src/` shows no import or render of the Subscribe component on any page.
- [ ] `PRODUCT.md` and `CLAUDE.md` carry no present-tense `vintagetechie` identity reference.

## Flagged assumptions

- The tempest install-command block is deferred (D-05); it will need a full rebrand once the self-hosted distribution infra (`dl.`/`pkg.jcrenshaw.dev`, Flatpak app ID, repo/keyring filenames) exists and the forward package identifiers are decided - separate distribution project, not this phase. The AUR line inside it (memory notes AUR is excluded from distribution) is part of that deferred work.
- OG source assets carry old identity - `public/og-image.svg` still reads `blog.vintagetechie.com`, and `og/*.html` card templates feed the generated PNGs. These are Phase 2 (IDENT-03/BLD-01); the planner must NOT pull them into Phase 1.
