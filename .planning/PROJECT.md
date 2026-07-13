# jcrenshaw.dev — self-hosted, self-updating front door

## What This Is

The public front door for **John Crenshaw** (handle `crenshawdev`, brand mark "JC"):
a desktop-OS-styled site that presents who he is, surfaces his latest essay and latest
code release, and routes visitors out to the writing and the repositories. This is a
**re-scope**: the site moves from a hand-pushed static Astro build to a **self-hosted,
event-driven platform** — Ghost as the content source of truth, an Astro SSR front end,
and a pipeline that updates the live site with zero manual steps. The existing design is
kept and evolved, not rebuilt.

## Core Value

jcrenshaw.dev is a living front door: John publishes in Ghost or cuts a project release,
and the public site updates itself with no human touch. The identity reads "John Crenshaw"
consistently, and every visit lands a reader in an essay or a project.

## Requirements

### Validated

Carried groundwork — already committed on `rebrand-to-jcrenshaw` and surviving the re-scope
(identity and content are the same; only the data source and delivery change):

- ✓ Identity rebrand: all current-identity copy/bylines/metadata read John Crenshaw / `crenshawdev` / `jcrenshaw.dev`, no `vintagetechie` leakage on rendered pages
- ✓ Code links repointed to `github.com/crenshawdev/...`; `latestCode.ts` reads the Tempest release from GitHub
- ✓ Subscribe UI removed for launch
- ✓ OG cards regenerated to the JC identity
- ✓ Desktop/boot-metaphor home (Dock/Panel/BaseLayout), writing + code rooms, about, RSS, WCAG 2.1 AA target, reduced-motion + no-JS fallback

### Active

Hypotheses until shipped and confirmed live:

- [ ] Astro runs in **server output** with a Node adapter; the existing pages and design render unchanged under the adapter
- [ ] The render layer reads content through a **data abstraction**, decoupled from source (markdown glob now, Ghost Content API after cutover)
- [ ] **Self-hosted Ghost + MySQL** stands up on the DO droplet under Coolify, seeded from the 19 local markdown posts, with the one dead `death-by-yes` feature image re-sourced
- [ ] Ghost-native newsletter is configured with **Mailgun** as the delivery provider
- [ ] The front end reads posts and pages from the **Ghost Content API** with full render parity (index, writing, `posts/[slug]`, about, RSS, OG)
- [ ] **Event-driven pipeline**: a Ghost publish webhook triggers an automatic rebuild+redeploy; a project release triggers the matching code page to update; OG cards regenerate inside the pipeline
- [ ] Site validated on a **staging subdomain** over real HTTPS, then **live at `jcrenshaw.dev`** behind Cloudflare Pro, served by the automated pipeline end to end

### Out of Scope

- **Paid members / Stripe** — design-for-don't-build this cycle. SSR keeps it a later switch-flip via Ghost Portal / Members API; confirm mechanics against Ghost docs when it comes off the table.
- **Download counters / stats** — separate future project (Cloudflare R2 + Worker + Analytics Engine → private Rust dashboard). The public site shows no counters.
- **listmonk / Resend** — retired and decommissioned; all email consolidates into Ghost + Mailgun.
- **Redesign** — the existing Astro design is kept and evolved, not replaced.
- **Mastodon move** (`@crenshawdev@tech.lgbt`) — separate, not this repo.

## Context

- **Repo:** `/data/projects/jcrenshaw.dev`, branch `rebrand-to-jcrenshaw`. Private GitHub `origin = git@github.com:crenshawdev/jcrenshaw.dev.git`, **not pushed**. Repo stays private permanently; only the deployed site is public.
- **Front end:** Astro `^6.2.2`. Currently `output: static`; the re-scope moves it to server output + Node adapter. Design in `BaseLayout.astro` + `Dock`/`Panel`; global CSS in `src/styles/global.css`. Pages in `src/pages/`. OG cards in `og/*.html` → `public/*.png` at 1200×630.
- **Content today:** 19 markdown posts in `./posts` (root), glob-loaded via `src/content.config.ts`, Ghost-export-shaped frontmatter (`published_at` required). The markdown still carries `__GHOST_URL__` markers — it IS the Ghost export in markdown form, which is what seeds the fresh Ghost.
- **Ghost:** fresh stand-up. John used Ghost(Pro) before, cancelled months ago; no members, no Stripe, no export JSON kept. Seed once from the local markdown.
- **Infra:** DO droplet `167.99.0.56` (private `10.116.0.2`), NYC1, 2vCPU / 4GB / 80GB, $24/mo, Coolify, behind Cloudflare Pro. 4GB is tight for Ghost + MySQL + Coolify + SSR — expand if needed. **Coolify admin is registered** (the pending human step is done). `minas-tirith` is the private build/test box, never the public front door.

## Constraints

- **Automation is non-negotiable.** Every derived artifact regenerates inside a pipeline with no human touch. Never ship a manual step as the steady-state answer (the phase-2 hand-rendered OG cards were exactly the anti-pattern being retired).
- **Design preserved.** Keep Dock/Panel/BaseLayout; SSR removes the `output: static` constraint that made Astro feel constrictive, without a framework switch.
- **Routing:** `trailingSlash: 'never'` — internal links stay extensionless and trailing-slash-free.
- **Deploy order:** build → validate on a staging subdomain over real HTTPS → only then cut the apex over (Coolify auto-HTTPS needs DNS resolving first).
- **Branch/push:** never work on `main`; on `rebrand-to-jcrenshaw`. Never push unless John asks.
- **Voice:** no em-dashes, don't open sentences with "So", no AI commit attribution.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Re-scope static → self-hosted event-driven platform | John wants a self-updating front door, not a hand-pushed static site; automation is foundational | - pending |
| Ghost self-hosted = content source of truth | Loved Ghost(Pro), owns the infra now, markdown already is the Ghost export | - pending |
| Astro SSR (server output + Node adapter), keep design | Removes the `output: static` constraint without a framework rebuild | - pending |
| Data abstraction between render and source | Lets SSR conversion land before Ghost exists, and swaps markdown → Ghost cleanly | - pending |
| Email via Ghost newsletter + Mailgun; retire listmonk | Consolidate audience/email into the owned platform, drop the tunnel/relay stack | - pending |
| Paid members tabled, design-for-don't-build | SSR keeps it a later switch-flip; no value shipping it now | ✓ good |

---
*Last updated: 2026-07-13 after re-scope to self-hosted Ghost + Astro SSR*
