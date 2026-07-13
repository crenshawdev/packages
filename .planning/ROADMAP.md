# Roadmap: jcrenshaw.dev — personal front-door site

## Overview

Three phases take the imported Astro site from old-brand source to a live public
front door. First rebrand the source — every current-identity reference becomes
John Crenshaw / `crenshawdev` / `jcrenshaw.dev`, the version fetch repoints to GitHub,
and the parked Subscribe UI comes out — so the site is fully rebranded and previewable
locally. Then regenerate the social/OG assets from the new identity and confirm the
build is clean with no leakage. Finally deploy through Coolify, validate on a staging
subdomain over real HTTPS, and cut the apex over to go live. The order is dependency-
driven: you cannot regenerate assets from an un-rebranded source, and you should not
deploy a build you have not verified clean.

## Phases

- [x] **Phase 1: Rebrand source & identity** - update all current-identity copy/links, repoint the version fetch to GitHub, remove Subscribe
- [x] **Phase 2: Assets & build integrity** - regenerate OG/social assets, verify a clean build with no old-brand leakage
- [ ] **Phase 3: Deploy & go live** - Coolify deploy, staging HTTPS validation, apex cutover at jcrenshaw.dev

## Phase Details

### Phase 1: Rebrand source & identity
**Goal:** The Astro source presents John Crenshaw's identity consistently and reads live release data from GitHub; the site is fully rebranded and previewable locally.
**Depends on:** Nothing (first phase)
**Requirements:** IDENT-01, IDENT-02, IDENT-04, LINK-01, LINK-02, SITE-01
**Success Criteria:**
1. Grepping the source for `vintagetechie` returns no matches in the current-identity surface (titles, bylines, metadata, nav, footer); only historical essay prose may retain the word.
2. Rendered pages (`npm run preview`) show the "John Crenshaw" byline and `jcrenshaw.dev` metadata site-wide.
3. `latestCode.ts` requests the GitHub API for `crenshawdev/tempest` and renders a live version (not the hardcoded fallback) when the repo resolves.
4. No in-page code/project link points to `gitlab.com/vintagetechie`; links resolve to `github.com/crenshawdev/...`.
5. The Subscribe component is imported and rendered on zero pages.

### Phase 2: Assets & build integrity
**Goal:** Social/OG assets reflect the new identity, and a full production build is clean with no old-brand leakage and valid routing.
**Depends on:** Phase 1
**Requirements:** IDENT-03, BLD-01, BLD-02
**Success Criteria:**
1. `public/og-image.svg` and the regenerated OG PNGs show the JC / jcrenshaw.dev identity and are committed under `public/`.
2. `npm run build` exits 0, and grepping the built `dist/` for `vintagetechie` finds nothing in the current-identity surface.
3. Spot-checking built HTML confirms internal links are extensionless and trailing-slash-free.

### Phase 3: Deploy & go live
**Goal:** The site is publicly live at `jcrenshaw.dev` over HTTPS, validated on staging first.
**Depends on:** Phase 2
**Requirements:** DPLY-01, DPLY-02, DPLY-03
**Success Criteria:**
1. Coolify pulls the private GitHub repo and produces a successful deployment of the built site.
2. The staging subdomain (e.g. `staging.jcrenshaw.dev`) serves the site over a valid Let's-Encrypt HTTPS certificate.
3. `https://jcrenshaw.dev` returns the site over HTTPS behind Cloudflare Pro.
