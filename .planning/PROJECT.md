# jcrenshaw.dev — personal front-door site

## What This Is

The public front door for **John Crenshaw** (handle `crenshawdev`, brand mark "JC"):
a desktop-OS-styled Astro site that presents who he is, surfaces his latest essay and
latest code release, and routes visitors out to the writing and the repositories. This
project is the **rebrand and go-live** of the existing Astro site — retiring the
`vintagetechie` persona, moving the source from GitLab to a private GitHub repo, and
deploying the site live at `jcrenshaw.dev` behind Cloudflare. The design is kept and
evolved, not rebuilt.

## Core Value

The site is live at `jcrenshaw.dev` presenting John Crenshaw's identity consistently —
zero `vintagetechie`/GitLab leakage on the public surface — and gets readers into an
essay or a project.

## Requirements

### Validated

Existing capabilities of the imported Astro site (brownfield — shipped under the old
brand, carried forward):

- ✓ Desktop/boot-metaphor home with Dock navigation, no-JS fallback, reduced-motion support
- ✓ Writing room: essay index + `posts/[slug]` rendering from 19 markdown posts
- ✓ Code room: project list with live latest-release version (Tempest, Weathervane) via `latestCode.ts`
- ✓ About page, RSS feed (`rss.xml`), per-project pages, OG link-preview cards
- ✓ WCAG 2.1 AA target, keyboard-navigable chrome, mobile full-screen-sheet layout

### Active

Hypotheses until shipped and confirmed live:

- [ ] All public copy, bylines, and metadata read "John Crenshaw" / `crenshawdev` / `jcrenshaw.dev`; no `vintagetechie` string on any rendered page
- [ ] `latestCode.ts` reads the latest Tempest release from the GitHub API (`crenshawdev/tempest`), verified resolving before cutover
- [ ] Project/code links point to the new GitHub locations; GitLab links updated or removed
- [ ] Subscribe UI removed from the site for launch (newsletter parked)
- [ ] Site builds clean and deploys to the DO droplet via Coolify behind Cloudflare Pro
- [ ] Live and reachable at `jcrenshaw.dev` over HTTPS, validated on a staging subdomain first

### Out of Scope

- Newsletter / subscribe wiring — parked this session; will use a managed service (Buttondown/EmailOctopus) later, not self-hosted on the site.
- Public download counters / stats — belongs to a separate future project (R2 + Worker + Analytics Engine); the public site shows no counters.
- Private Rust stats dashboard — separate private project, John-only, not this repo.
- Build-host migration (GitLab CI → minas-tirith LXC) — orthogonal, later.
- Rewriting the design — the existing Astro design is kept and evolved, not replaced.

## Context

- **Repo:** `/data/projects/jcrenshaw.dev`, fresh git history (old GitLab history dropped; archive at `/data/code/vintagetechie-dev.gitlab.io`). Branch `rebrand-to-jcrenshaw`. Baseline commit imported the Astro site (60 files). Private GitHub `origin` = `git@github.com:crenshawdev/jcrenshaw.dev.git`, **not pushed**. Repo stays **private permanently** — only the deployed site is public.
- **Stack:** Astro `^6.2.2`, static build to `dist/`. Posts are markdown in `./posts` (root), glob-loaded via `src/content.config.ts`; frontmatter is Ghost-export-shaped (`published_at` required). Pages in `src/pages/`; chrome in `BaseLayout.astro` + `Dock`/`Panel`/`Subscribe` components; global CSS in `src/styles/global.css`. OG cards in `og/*.html` → `public/*.png` at 1200×630.
- **Rebrand surface (measured):** `vintagetechie`/`gitlab` strings appear in `src/lib/latestCode.ts`, `src/pages/{index,code}.astro`, `src/pages/code/{tempest,weathervane}.astro`, `PRODUCT.md`, `public/og-image.svg`, and 4 posts (`why-i-left-github`, `why-i-started-writing-rust-in-retirement`, `still-skidding-broadside`, `i-built-my-own-door`, `page-about`). Historical prose in essays is left factual where it refers to the past; only current-identity references are updated.
- **Tempest move:** John imports Tempest to `github.com/crenshawdev/tempest` (GitHub import, keeps history, renamed from `cosmic-ext-applet-tempest`) **before** go-live, which is why the version fetch repoints to GitHub.
- **Hosting:** DO droplet `167.99.0.56` (private `10.116.0.2`), Coolify 1-click, behind Cloudflare Pro (edge cache carries availability; single origin may blink). Coolify admin registration at `http://167.99.0.56:8000` is a pending human step John owns.

## Constraints

- **Tech stack**: Astro 6 static site → `dist/` — keep the existing design, evolve don't rebuild.
- **Routing**: `trailingSlash: 'never'` with `build.format: 'directory'` — internal links must stay extensionless and trailing-slash-free.
- **CI**: `.gitlab-ci.yml` runs only on the default branch (`npm ci && npm run build`, then `mv dist public`); it does NOT run `render-og.mjs`, so regenerated OG PNGs must be committed in `public/`.
- **Branch/push**: never work on `main`; currently on `rebrand-to-jcrenshaw`. Never push unless John asks.
- **Deploy order**: build → verify on a staging subdomain (e.g. `staging.jcrenshaw.dev`) with real Coolify/Let's-Encrypt HTTPS → only then point apex `jcrenshaw.dev` (Coolify auto-HTTPS needs DNS resolving first).
- **Voice**: no em-dashes, don't open sentences with "So", no AI commit attribution.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scope = site only (rebrand + deploy) | Stats pipeline and Rust dashboard are separate projects; keeps this focused and shippable | ✓ good |
| Keep & evolve the Astro design | Strong existing design and PRODUCT.md; rebrand is identity, not redesign | ✓ good |
| Repoint `latestCode.ts` to GitHub `crenshawdev/tempest` | Tempest imported to GitHub before launch; single source of truth under new identity | - pending |
| Remove Subscribe UI for launch | Newsletter parked; managed service wired later, don't ship a dead form | ✓ good |
| Deploy via Coolify on DO behind Cloudflare Pro | Owned origin + edge cache for the nines; off-the-shelf deploy, no hand-tooling | - pending |
| Private source repo, public deployed site only | Repo is just the build source Coolify pulls | ✓ good |

---
*Last updated: 2026-07-13 after project initialization*
