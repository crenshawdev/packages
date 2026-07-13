---
phase: 1
plan: 1
requirements: [IDENT-01, IDENT-02, IDENT-04, LINK-01, LINK-02, SITE-01]
files:
  - src/lib/latestCode.ts
  - src/pages/index.astro
  - src/pages/code.astro
  - src/pages/code/tempest.astro
  - src/pages/code/weathervane.astro
  - posts/page-about.md
  - src/pages/posts/[slug].astro
  - PRODUCT.md
  - CLAUDE.md
---

# Phase 1: Rebrand source & identity - Plan

## Goal

The Astro source presents John Crenshaw's identity consistently and reads live
release data from GitHub; the site is fully rebranded and previewable locally.

## Must be true when done

- `grep -rn "vintagetechie" src/` returns matches ONLY inside the deferred tempest
  install `<pre><code>` block (`src/pages/code/tempest.astro:35-49`); every other
  current-identity surface (titles, descriptions, links, boot log, alt text) is clean.
- `npm run preview` shows the "John Crenshaw" byline and `jcrenshaw.dev`
  canonical/OG metadata on the home, writing, about, and code pages, with no
  "(VintageTechie)" in any page description.
- `latestCode.ts` fetches `crenshawdev/tempest` from the GitHub API and the home and
  code pages render a live version (`v2.11.0`) WITH the release date, not the
  hardcoded fallback; the `FALLBACK` constant reads `v2.11.0`.
- Every rendered source/releases/repo link resolves to `github.com/crenshawdev/...`
  (or weathervane's crates.io/docs.rs links); no `gitlab.com/vintagetechie` link
  renders on any page, including `/about`.
- The Subscribe component is imported and rendered on zero pages.
- `PRODUCT.md` and `CLAUDE.md` carry no present-tense `vintagetechie` identity reference.

## Context

- Locked decisions bind this plan: D-01 (per-file string edits, chrome already reads
  correctly), D-02 (repoint the `/about` body link), D-03 (rewrite `latestCode.ts` to
  the GitHub tags+commit path, `FALLBACK` → `v2.11.0`), D-04 (repoint tempest/
  weathervane/powercurve links to GitHub), D-05 (do NOT touch the tempest install
  `<pre><code>` block, lines 35-49 — its `vintagetechie` strings are an explicit
  carve-out that stay), D-06 (delete only the Subscribe import + render).
- Out of scope: OG/social asset regeneration (Phase 2 — `public/og-image.svg`,
  `og/*.html`), the tempest install-command block, historical essay prose, and the
  `.gitlab-ci.yml` filename reference in CLAUDE.md (a real file; deploy migration is
  Phase 3). Do not pull any of these in.
- `crenshawdev/tempest`, `crenshawdev/weathervane`, `crenshawdev/powercurve` are all
  verified public; latest tempest tag is `v2.11.0`. GitHub publishes no Releases for
  tempest (`releases/latest` → 404), so the tags endpoint is required.

## Tasks

### Task 1: Repoint latestCode.ts to the GitHub tags + commit API

- **Files:** src/lib/latestCode.ts
- **Action:** Replace the GitLab fetch with the GitHub tags-then-commit path,
  preserving the exported `LatestCode` interface (`version`, `released`, `live`), the
  memoization (`cache`), the 8s `AbortSignal.timeout`, the `User-Agent` header, and the
  fallback-on-error behavior. Delete the `PROJECT`/`TAGS_URL` GitLab constants; fetch
  the newest tag from `https://api.github.com/repos/crenshawdev/tempest/tags?per_page=1`
  (send header `Accept: application/vnd.github+json` alongside the existing User-Agent).
  Take `tags[0].name` for `version` (keep the `startsWith('v') ? name : 'v'+name`
  normalization). GitHub does not include a date on the tag object, so make a second
  fetch to `tags[0].commit.url` (the per-commit endpoint) and read the committer date at
  `.commit.committer.date` for `released`. The second fetch MUST send the same headers
  and timeout as the first (`User-Agent` and `Accept: application/vnd.github+json`, plus
  the 8s `AbortSignal.timeout`) — GitHub returns HTTP 403 on any request without a
  `User-Agent`, so a bare `fetch(commit.url)` would fail and silently fall back. Check
  `res.ok` on both responses; on any failure of either request throw so the catch returns
  the fallback. Change `FALLBACK` from `{ version: 'v2.9.5', ... }` to
  `{ version: 'v2.11.0', released: null, live: false }`. Update the file's top comment
  from "GitLab API" to "GitHub API". Do not add auth tokens (public repo, ~2 requests
  per build stays under the unauthenticated rate limit).
- **Verify:** `grep -n "gitlab\|vintagetechie\|v2.9.5" src/lib/latestCode.ts` returns
  nothing; `grep -n "v2.11.0" src/lib/latestCode.ts` matches `FALLBACK`; running
  `npm run build` prints no `[latestCode] using fallback` warning and the built home/
  code pages contain `v2.11.0` and a "Latest release · <month day year>" line.

### Task 2: Rebrand identity and repoint links on the home and code-list pages

- **Files:** src/pages/index.astro, src/pages/code.astro
- **Action:** In `index.astro`: change `code.href` (line ~38) from the GitLab tempest
  URL to `https://github.com/crenshawdev/tempest`; remove "(VintageTechie)" from the
  `description` (line ~46) so it reads "The front door to John Crenshaw: retired
  engineer..."; change the boot-log line's `gitlab.com/vintagetechie` (line ~70) to
  `github.com/crenshawdev`; change the "Get it on GitLab ↗" card link text (line ~153)
  and the "Browse the code on GitLab ↗" ghost link text (line ~160) to say "GitHub";
  update the "GitLab API" comment (line ~30) to "GitHub API". In `code.astro`: change
  the powercurve `href` (line ~29) to `https://github.com/crenshawdev/powercurve`;
  remove "(VintageTechie)" from the `description` (line ~37); change the footer "All
  repositories live at gitlab.com/vintagetechie ↗" line (line ~62) to link
  `https://github.com/crenshawdev` with text "github.com/crenshawdev ↗"; update the
  "GitLab API" comment (line ~5) to "GitHub API". Do not alter the `code.name`
  (`cosmic-ext-applet-tempest`) or the project list `name` fields — those are the actual
  crate/package names, not identity strings.
- **Verify:** `grep -in "gitlab\|vintagetechie" src/pages/index.astro src/pages/code.astro`
  returns nothing; `npm run preview` home page shows "Get it on GitHub" / "Browse the
  code on GitHub" pointing at `github.com/crenshawdev/tempest`, and the code page footer
  links to `github.com/crenshawdev`.

### Task 3: Repoint the tempest and weathervane project-page links

- **Files:** src/pages/code/tempest.astro, src/pages/code/weathervane.astro
- **Action:** In `tempest.astro`, repoint ONLY the worklog links: the `source` link
  (line ~55) to `https://github.com/crenshawdev/tempest` with anchor text
  `github.com/crenshawdev`, and the `releases` link (line ~56) to
  `https://github.com/crenshawdev/tempest/tags` (keep the "all versions" text). Do NOT
  touch the install `<pre><code>` block (lines 35-49): the Flatpak app ID
  `com.vintagetechie.CosmicExtAppletTempest`, the `vintagetechie.*` keyring/repo
  filenames, the `dl.`/`pkg.jcrenshaw.dev` endpoints, and the AUR line stay exactly as
  written — this is the D-05 carve-out because the self-hosted distribution infra is not
  built and rebranding now would ship broken install commands. In `weathervane.astro`,
  repoint the `source` worklog link (line ~41) to
  `https://github.com/crenshawdev/weathervane` with anchor text `github.com/crenshawdev`;
  leave the crates.io and docs.rs links unchanged.
- **Verify:** `grep -n "vintagetechie" src/pages/code/tempest.astro` returns matches only
  on lines within 35-49; `grep -n "gitlab" src/pages/code/tempest.astro
  src/pages/code/weathervane.astro` returns nothing; the two source links resolve to
  `github.com/crenshawdev/tempest` and `github.com/crenshawdev/weathervane`.

### Task 4: Repoint the About-page body repo link

- **Files:** posts/page-about.md
- **Action:** On line 19, change the sentence "The code lives on
  `<a href="https://gitlab.com/vintagetechie">GitLab</a>`" so the href is
  `https://github.com/crenshawdev` and the anchor text reads "GitHub". This is a live
  present-tense link (D-02), not historical narration, so it is updated; leave the rest
  of the about-page prose untouched.
- **Verify:** `grep -n "gitlab" posts/page-about.md` returns nothing; `npm run preview`
  `/about` renders "The code lives on GitHub" linking to `github.com/crenshawdev`.

### Task 5: Remove the Subscribe import and render from the post template

- **Files:** src/pages/posts/[slug].astro
- **Action:** Delete the `import Subscribe from '../../components/Subscribe.astro';`
  line (line ~4) and the `<Subscribe />` render (line ~58). Per D-06, leave
  `src/components/Subscribe.astro` and its CSS in `src/styles/global.css` orphaned in
  place for the parked-newsletter revival — do not delete them.
- **Verify:** `grep -rn "Subscribe" src/pages/` returns nothing; `grep -rln "Subscribe"
  src/` still lists `src/components/Subscribe.astro` (component preserved); `npm run
  build` succeeds and a rendered post page contains no subscribe form.

### Task 6: Update in-repo identity docs

- **Files:** PRODUCT.md, CLAUDE.md
- **Action:** In `PRODUCT.md`: remove "(VintageTechie)" from the Product Purpose line
  (line ~17) so it reads "A personal 'front door' for John Crenshaw:"; change "a GitLab
  repo" in the Users section (line ~12) to "a GitHub repo"; change "self-hosted
  distribution, GitLab" in Design Principle 5 (line ~56) to "self-hosted distribution,
  GitHub". In `CLAUDE.md`: change the title heading (line 1) from
  "vintagetechie-dev.gitlab.io — project notes" to "jcrenshaw.dev — project notes".
  Leave the `.gitlab-ci.yml` reference (line ~19) as-is — it names a real file in the
  repo and the CI/deploy migration is Phase 3, out of scope here.
- **Verify:** `grep -in "vintagetechie" PRODUCT.md CLAUDE.md` returns nothing;
  `grep -n "gitlab-ci" CLAUDE.md` still matches the CI gotcha note.

## Notes

- After all tasks, the phase-level check is `grep -rn "vintagetechie" src/` returning
  matches only inside `src/pages/code/tempest.astro` lines 35-49. Any other match is a
  regression to fix before the phase is done.
- `latestCode.ts` renders live data only when the build host can reach the GitHub API.
  If a build runs offline it will fall back to `v2.11.0` (no date) without failing;
  Task 1's verify assumes network access so the live path is exercised.
