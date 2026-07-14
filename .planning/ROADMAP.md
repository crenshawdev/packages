# Roadmap: jcrenshaw.dev — self-hosted, self-updating front door

## Overview

Five phases take the rebranded Astro site from a static, hand-pushed build to a
self-hosted, event-driven platform. First convert the front end to SSR behind a data
abstraction, so the framework change lands while content still comes from markdown and
nothing visual moves. Then stand up self-hosted Ghost on the droplet and seed it from the
19 local posts, giving the platform its content source of truth. Cut the front end over to
the Ghost Content API with full render parity. Build the automation pipeline that makes the
site self-updating — publish and release webhooks, in-pipeline OG regeneration, Coolify
deploy — and prove it on staging over real HTTPS. Finally cut the apex over to go live.

The order is dependency-driven: SSR must exist before Ghost can feed it, Ghost must hold
the content before cutover, cutover must work before automation wraps it, and the whole
machine is validated on staging before the apex flips. Coolify admin is already registered,
so Ghost stand-up and deploy are unblocked.

## Phases

- [x] **Phase 1: Astro SSR foundation** - server output + Node adapter behind a data abstraction; design unchanged, content still from markdown
- [x] **Phase 2: Ghost stand-up & seed** - self-hosted Ghost + MySQL on the droplet, seeded from 19 posts, newsletter + Mailgun, Content API key
- [x] **Phase 3: Content API cutover** - front end reads Ghost instead of markdown, full render parity
- [ ] **Phase 4: Automation pipeline** - publish/release webhooks, in-pipeline OG regen, Coolify deploy, validated on staging HTTPS
- [ ] **Phase 5: Go live** - apex cutover to jcrenshaw.dev behind Cloudflare Pro, end-to-end automated

## Phase Details

### Phase 1: Astro SSR foundation
**Goal:** The front end runs in server output with a Node adapter, reads content through a data abstraction, and renders the existing design and pages identically — with content still sourced from the markdown glob.
**Depends on:** Carried rebrand groundwork (already committed)
**Requirements:** SSR-01, SSR-02
**Success Criteria:**
1. Astro config uses server output with a Node adapter; `npm run build` and the adapter's server start both succeed.
2. Every existing page (index, writing, `posts/[slug]`, about, code, RSS) renders under SSR with no visual or content change versus the static build.
3. The render layer obtains content through a single data-source module (the abstraction), backed by the markdown glob at this phase.

### Phase 2: Ghost stand-up & seed
**Goal:** Self-hosted Ghost is running on the droplet under Coolify, seeded from the 19 local posts, with a Content API key and Ghost-native newsletter wired to Mailgun.
**Depends on:** Phase 1 (front end ready to consume Ghost); Coolify admin registered
**Requirements:** GHST-01, GHST-02, GHST-03, GHST-04
**Success Criteria:**
1. Ghost + MySQL deploy under Coolify and the Ghost admin is reachable and usable.
2. The 19 markdown posts exist in Ghost with title/slug/body/`published_at` parity; the dead `death-by-yes` feature image is re-sourced and renders.
3. A Content API key is issued and a test query from the front end's environment returns the seeded posts.
4. Ghost newsletter is configured with Mailgun and a test send is delivered.

### Phase 3: Content API cutover
**Goal:** The front end reads all content from the Ghost Content API through the Phase-1 abstraction, with render parity against the markdown build.
**Depends on:** Phase 2
**Requirements:** CUT-01, CUT-02, CUT-03
**Success Criteria:**
1. The data-source module reads from the Ghost Content API; the markdown glob is no longer the live source.
2. Index latest-essay, writing index, `posts/[slug]`, about, and RSS render from Ghost data with no regression against the markdown build.
3. OG card data (title/excerpt/identity) is derived from Ghost content, not hand-authored per post.

### Phase 4: Automation pipeline
**Goal:** The site is self-updating — a Ghost publish or a project release drives an automatic rebuild+redeploy through Coolify, OG cards regenerate in-pipeline, and the whole machine is validated on a staging subdomain over real HTTPS.
**Depends on:** Phase 3
**Requirements:** AUTO-01, AUTO-02, AUTO-03, AUTO-04, DPLY-01
**Success Criteria:**
1. A Ghost publish/update webhook triggers an automatic rebuild + redeploy with no manual step; the staging site reflects the change.
2. A project release (tag/build) triggers the matching code page to update automatically.
3. OG cards regenerate inside the pipeline on content change; none are hand-rendered.
4. Coolify deploys the SSR site from the private GitHub repo, and the staging subdomain serves it over a valid Let's-Encrypt HTTPS certificate reading live Ghost.

### Phase 5: Go live
**Goal:** jcrenshaw.dev is publicly live over HTTPS behind Cloudflare Pro, served by the automated pipeline end to end.
**Depends on:** Phase 4
**Requirements:** DPLY-02
**Success Criteria:**
1. The apex `jcrenshaw.dev` is cut over to the droplet and returns the site over HTTPS behind Cloudflare Pro.
2. A publish in Ghost, with no human touch, appears on the live apex site through the pipeline.
