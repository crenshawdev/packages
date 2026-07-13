# Requirements: jcrenshaw.dev — personal front-door site

**Defined:** 2026-07-13
**Core Value:** The site is live at `jcrenshaw.dev` presenting John Crenshaw's identity consistently — zero `vintagetechie`/GitLab leakage on the public surface — and gets readers into an essay or a project.

## v1 Requirements

Committed scope. Each maps to exactly one roadmap phase.

### Identity

- [ ] **IDENT-01**: No `vintagetechie` string appears in the current-identity surface of any rendered page — site title, bylines, author metadata, nav, footer, alt text. (Historical essay prose that factually refers to the past persona is left as written.)
- [ ] **IDENT-02**: Author/byline and page metadata read "John Crenshaw" site-wide (titles, `<meta>`, RSS author, canonical host `jcrenshaw.dev`).
- [ ] **IDENT-03**: OG/social assets (`public/og-image.svg` and the OG cards) present the JC / jcrenshaw.dev identity, no vintagetechie mark.
- [ ] **IDENT-04**: `PRODUCT.md` and other in-repo identity references updated to John Crenshaw / jcrenshaw.dev.

### Links & Data

- [ ] **LINK-01**: `latestCode.ts` fetches the latest Tempest release from the GitHub API (`crenshawdev/tempest`) and renders a live version; the repo is verified resolving before cutover so the page does not silently fall back.
- [ ] **LINK-02**: All code/project links and repo references point to the new GitHub locations; stale GitLab links are updated or removed.

### Site

- [ ] **SITE-01**: The Subscribe component is removed from every page for launch, with no dead form or inert affordance left behind.

### Build & Assets

- [ ] **BLD-01**: OG preview cards regenerated to reflect the new identity and committed as PNGs in `public/`.
- [ ] **BLD-02**: `npm run build` completes clean; internal links stay extensionless and trailing-slash-free; no `vintagetechie` string in the built `dist/` public surface.

### Deploy

- [ ] **DPLY-01**: The site deploys to the DO droplet via Coolify from the private GitHub repo.
- [ ] **DPLY-02**: The site is validated on a staging subdomain over real Coolify/Let's-Encrypt HTTPS before any apex cutover.
- [ ] **DPLY-03**: The site is live and reachable at `jcrenshaw.dev` over HTTPS behind Cloudflare Pro.

## v2 Requirements

Deferred. Tracked, not in the current roadmap.

### Newsletter

- **NEWS-01**: Subscribe signup wired to a managed newsletter service (Buttondown/EmailOctopus).

## Out of Scope

Explicit exclusions. The reason prevents scope creep later.

| Feature | Reason |
|---------|--------|
| Self-hosted newsletter on the site | Parked; deliverability belongs to a managed service, laptop stays the fortress |
| Public download counters | Separate future project (R2 + Worker + Analytics Engine); public site shows no counters |
| Private Rust stats dashboard | Separate private, John-only project, not this repo |
| Build-host migration (GitLab CI → minas-tirith) | Orthogonal to the site rebrand; later |
| Redesign of the site | Design is kept and evolved, not rebuilt |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IDENT-01 | Phase 1 | Complete |
| IDENT-02 | Phase 1 | Complete |
| IDENT-03 | Phase 2 | Complete |
| IDENT-04 | Phase 1 | Complete |
| LINK-01 | Phase 1 | Complete |
| LINK-02 | Phase 1 | Complete |
| SITE-01 | Phase 1 | Complete |
| BLD-01 | Phase 2 | Complete |
| BLD-02 | Phase 2 | Complete |
| DPLY-01 | Phase 3 | Pending |
| DPLY-02 | Phase 3 | Pending |
| DPLY-03 | Phase 3 | Pending |

**Coverage:** 12 v1 requirements, 12 mapped, 0 unmapped

---
*Last updated: 2026-07-13 after project initialization*
