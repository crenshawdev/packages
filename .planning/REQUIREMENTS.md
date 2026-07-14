# Requirements: jcrenshaw.dev — self-hosted, self-updating front door

**Defined:** 2026-07-13 (re-scope)
**Core Value:** jcrenshaw.dev updates itself — John publishes in Ghost or cuts a release, and the live public site reflects it with zero manual steps, identity reading John Crenshaw throughout.

## Carried Groundwork

Already committed on `rebrand-to-jcrenshaw` and surviving the re-scope. Not re-numbered as phases; listed for traceability.

- Identity rebrand (strings, bylines, metadata) → John Crenshaw / `crenshawdev` / `jcrenshaw.dev`
- Code links repointed to GitHub; `latestCode.ts` reads Tempest release from GitHub
- Subscribe UI removed
- OG cards regenerated to JC identity

## v1 Requirements

Committed scope. Each maps to exactly one roadmap phase.

### SSR Foundation

- [ ] **SSR-01**: Astro builds and runs in **server output** with a Node adapter; the existing pages and design render unchanged under the adapter.
- [ ] **SSR-02**: The render layer reads content through a **data-source abstraction** decoupled from origin, backed by the markdown glob at this phase so nothing visual changes.

### Ghost Platform

- [ ] **GHST-01**: Self-hosted **Ghost + MySQL** stands up on the DO droplet under Coolify; admin is reachable and usable.
- [ ] **GHST-02**: The **19 local markdown posts** are seeded into Ghost with title/slug/body/`published_at` parity; the dead `death-by-yes` `__GHOST_URL__` feature image is re-sourced.
- [ ] **GHST-03**: A **Ghost Content API** key is issued and the API is reachable from the front end.
- [ ] **GHST-04**: Ghost-native **newsletter** is configured with **Mailgun** as the delivery provider.

### Content Cutover

- [ ] **CUT-01**: The front end reads posts and pages from the **Ghost Content API** through the SSR data abstraction, replacing the markdown glob.
- [ ] **CUT-02**: **Render parity** — index latest-essay, writing index, `posts/[slug]`, about, and RSS are produced from Ghost data with no visual or content regression against the markdown build.
- [ ] **CUT-03**: **OG card data** is sourced from Ghost content (title/excerpt/identity), not hand-authored per post.

### Automation Pipeline

- [ ] **AUTO-01**: A **Ghost publish/update webhook** triggers an automatic site rebuild + redeploy with no manual step.
- [ ] **AUTO-02**: A **project release** (tag/build in its repo) triggers the matching code page to update automatically.
- [ ] **AUTO-03**: **OG cards regenerate inside the pipeline** on content change, never hand-rendered.
- [ ] **AUTO-04**: **Coolify deploys** the SSR site from the private GitHub repo; the whole publish → live path is zero-touch.

### Deploy & Go Live

- [ ] **DPLY-01**: The SSR site is validated on a **staging subdomain** over real Coolify/Let's-Encrypt HTTPS, reading live Ghost, before any apex cutover.
- [ ] **DPLY-02**: **`jcrenshaw.dev` is live** over HTTPS behind Cloudflare Pro, served by the automated pipeline end to end.

## v2 Requirements

Deferred. Tracked, not in the current roadmap.

- **MEMB-01**: Paid members via Ghost Portal / Members API + Stripe. SSR keeps this a later switch-flip; confirm mechanics against Ghost docs first.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Paid members / Stripe (now) | Design-for-don't-build; no value shipping it this cycle |
| Download counters / stats | Separate future project (R2 + Worker + Analytics Engine → private Rust dashboard) |
| listmonk / Resend | Retired; email consolidates into Ghost + Mailgun |
| Redesign | Design kept and evolved, not rebuilt |
| Mastodon move | Separate, not this repo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SSR-01 | Phase 1 | Complete |
| SSR-02 | Phase 1 | Complete |
| GHST-01 | Phase 2 | Complete |
| GHST-02 | Phase 2 | Complete |
| GHST-03 | Phase 2 | Complete |
| GHST-04 | Phase 2 | Complete |
| CUT-01 | Phase 3 | Pending |
| CUT-02 | Phase 3 | Pending |
| CUT-03 | Phase 3 | Pending |
| AUTO-01 | Phase 4 | Pending |
| AUTO-02 | Phase 4 | Pending |
| AUTO-03 | Phase 4 | Pending |
| AUTO-04 | Phase 4 | Pending |
| DPLY-01 | Phase 4 | Pending |
| DPLY-02 | Phase 5 | Pending |

**Coverage:** 15 v1 requirements, 15 mapped, 0 unmapped

---
*Last updated: 2026-07-13 after re-scope to self-hosted Ghost + Astro SSR*
