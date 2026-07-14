---
phase: 4
plan: 1
requirements: [AUTO-01, AUTO-02, AUTO-03, AUTO-04, DPLY-01]
files:
  - src/lib/latestCode.ts
  - src/pages/code/tempest.astro
  - og/tempest-card.html
  - og/render-og.mjs
  - package.json
  - .gitignore
  - public/og-image.png
  - public/tempest-og.png
  - public/weathervane-og.png
  - Dockerfile
  - .dockerignore
  - .gitlab-ci.yml
---

# Phase 4: Automation pipeline - Plan

## Goal

The site is self-updating: a Ghost publish or a project release drives an automatic
update through Coolify, OG cards regenerate in-pipeline, and the whole machine is
validated on a staging subdomain over real Let's-Encrypt HTTPS reading live Ghost.

## Must be true when done

- Publishing or updating a post in Ghost makes it appear on the staging site with no
  manually-run build or deploy step (SSR reads Ghost live; the webhook is wired).
- The staging code page and home "latest code" show the current live Tempest release
  tag read from GitHub, and no hardcoded version string remains in
  `src/pages/code/tempest.astro` or `og/tempest-card.html`.
- A build from a clean checkout regenerates `og-image.png`, `tempest-og.png`, and
  `weathervane-og.png` (1200x630) as artifacts, and `git ls-files public` no longer
  lists those three PNGs.
- Coolify builds and deploys the SSR site from the private GitHub repo using the
  committed Dockerfile, and the running staging deploy serves pages with live Ghost
  content.
- `curl -I https://staging.jcrenshaw.dev` returns HTTP 200 over a valid Let's-Encrypt
  certificate with no browser cert warning.

## Context

- Locked decisions D-01..D-06 in `phases/4/CONTEXT.md` are authoritative. D-01: the
  Ghost webhook purges edge cache only, no rebuild; SSR (`src/lib/content.ts`,
  per-request fetch) makes a publish live on the next request. D-02: live-fetch +
  de-hardcode the Tempest version. D-03: retire hand-committed OG PNGs, run
  `render-og.mjs` in-pipeline with Playwright as a real dep. D-04: Coolify deploys via
  a repo-committed Dockerfile (chosen for the chromium binary); the dead
  `.gitlab-ci.yml` is removed. D-05: deploy target is the SFO3 droplet
  `137.184.184.60` running Coolify. D-06: validate on `staging.jcrenshaw.dev` over LE
  HTTPS first.
- The staging host must be Cloudflare DNS-only (grey cloud): the DPLY-01 acceptance
  criterion requires the browser to see the origin Let's-Encrypt cert, which only holds
  when Cloudflare is not proxying. DNS-only also means no edge HTML cache sits in front
  of staging, so D-01's purge has nothing to act on there (D-01's own evidence note
  says the purge is "effectively a no-op" when the host is DNS-only). On staging,
  AUTO-01 is proven by the SSR live-read path plus a firing Ghost webhook; the concrete
  Cloudflare purge-API target lands with the Cloudflare Pro proxy at apex cutover
  (Phase 5), which is where the edge cache first exists.
- Existing patterns to follow: `getLatestCode()` in `src/lib/latestCode.ts` (already
  consumed by `src/pages/index.astro` and `src/pages/code.astro`); the OG render script
  `og/render-og.mjs`; Astro `output:'server'` with `@astrojs/node` standalone
  (server entry builds to `dist/server/entry.mjs`).
- Out of scope: apex cutover and Cloudflare Pro go-live (Phase 5, DPLY-02), any
  design/copy change, analytics/counters, paid members.

## Tasks

### Task 1: Give latestCode a TTL so the long-lived SSR server re-fetches

- **Files:** src/lib/latestCode.ts
- **Action:** The module currently memoizes `fetchLatest()` into a module-scope
  `cache` that never expires, with a stale "at build time" comment; under SSR this
  process is long-lived, so the version would freeze until redeploy. Replace the
  permanent memo with a time-boxed cache: store both the pending/resolved
  `Promise<LatestCode>` and the timestamp it was created, and in `getLatestCode()`
  re-fetch when `Date.now()` exceeds the stored timestamp plus a TTL constant of
  600000 ms (10 minutes). Do not cache a fallback result for the full TTL if you can
  avoid it, but a fallback caching for the TTL is acceptable; keep the existing
  try/catch fallback to `FALLBACK` so a GitHub hiccup never throws. Update the
  file's top comment and the header comment to describe TTL-based re-fetch under SSR
  instead of "at build time". Do not change the public signature
  `getLatestCode(): Promise<LatestCode>` or the `LatestCode` shape (callers in
  `index.astro`/`code.astro` must be untouched).
- **Verify:** `rtk grep "600000\|TTL\|Date.now" src/lib/latestCode.ts` shows the TTL
  logic; `rtk npm run build` succeeds; the string "at build time" no longer appears in
  the file (`rtk grep "at build time" src/lib/latestCode.ts` returns nothing).

### Task 2: De-hardcode the Tempest version badge on the code page

- **Files:** src/pages/code/tempest.astro
- **Action:** The badge `<span class="badge">v2.9.0</span>` (line 20) is stale and
  hand-set. In the frontmatter, import `getLatestCode` from `../../lib/latestCode` and
  `const tempest = await getLatestCode();`, then render the badge from
  `tempest.version` instead of the literal. Match the display format already used on
  `code.astro` (the value is like `v2.11.0`). Leave the other badges (Rust, GPL-3.0,
  AUR, Flatpak, deb, rpm) unchanged. Do not touch the `ogImage` cache-buster query.
- **Verify:** `rtk grep "2\.9\.0" src/pages/code/tempest.astro` returns nothing;
  `rtk npm run build` succeeds; running `npm run dev` and loading `/code/tempest` shows
  the version badge matching the latest tag at github.com/crenshawdev/tempest/tags.

### Task 3: Make the Tempest OG card version track the live release at render time

- **Files:** og/tempest-card.html, og/render-og.mjs
- **Action:** In `og/tempest-card.html` replace the hardcoded value `2.11.0` in the
  version ledger row (line 226) with the literal token `{{TEMPEST_VERSION}}`. In
  `og/render-og.mjs`, before the render loop, fetch the latest Tempest tag from
  `https://api.github.com/repos/crenshawdev/tempest/tags?per_page=1` (same URL and
  `User-Agent`/`Accept` headers pattern as `src/lib/latestCode.ts`, with an
  `AbortSignal.timeout`), take `tags[0].name`, and strip any leading `v` to get a bare
  version like `2.11.0`; on any fetch failure log a warning and fall back to `2.11.0`
  so OG rendering still proceeds. For each card, read its HTML file with `fs`,
  string-replace `{{TEMPEST_VERSION}}` with the resolved version (a no-op for cards
  without the token), and render via `page.setContent(html, { waitUntil: 'networkidle' })`
  instead of `page.goto('file://'...)`; keep the `document.fonts.ready` wait, the
  150ms settle, and the exact 1200x630 clip. The cards reference only absolute
  (Google Fonts) assets, so `setContent` needs no base href.
- **Verify:** `rtk grep "2\.11\.0" og/tempest-card.html` returns nothing and
  `rtk grep "TEMPEST_VERSION" og/tempest-card.html` finds the token; running
  `node og/render-og.mjs tempest` writes `public/tempest-og.png`, and opening it shows
  the version row matching the current latest Tempest tag.

### Task 4: Make OG cards build artifacts, not committed files

- **Files:** package.json, .gitignore, public/og-image.png, public/tempest-og.png, public/weathervane-og.png
- **Action:** Add `playwright` to `dependencies` (not devDependencies, since the deploy
  image installs from prod deps) at a current version; `og/render-og.mjs` imports
  `{ chromium } from 'playwright'`. Add a `"prebuild": "node og/render-og.mjs"` script
  so `npm run build` regenerates all three cards before `astro build` runs (npm runs
  `prebuild` automatically before `build`); leave `"build": "astro build"` as-is. Then
  stop tracking the generated PNGs: `git rm --cached public/og-image.png
  public/tempest-og.png public/weathervane-og.png` and add those three paths (or a
  matching pattern) to `.gitignore`. Do not untrack `public/apple-touch-icon.png` or
  `public/icon-512.png` (those are real static assets, not OG artifacts). Playwright's
  chromium browser binary is provisioned in the Dockerfile (Task 5), so a bare
  `npm run build` on a machine without the browser installed will fail the OG step by
  design (safe failure: the prior good deploy keeps serving).
- **Verify:** `rtk git ls-files public` lists `apple-touch-icon.png` and `icon-512.png`
  but none of the three OG PNGs; with chromium installed
  (`npx playwright install chromium`), deleting the three PNGs and running
  `rtk npm run build` recreates all three at 1200x630
  (`file public/tempest-og.png` reports PNG 1200 x 630).

### Task 5: Replace the GitLab static CI with a Coolify Dockerfile

- **Files:** Dockerfile, .dockerignore, .gitlab-ci.yml
- **Action:** Delete `.gitlab-ci.yml` (the dead static `mv dist public` Pages path;
  Coolify replaces it). Add a multi-stage `Dockerfile` on a Node 22 base
  (`node:22-bookworm-slim` so Playwright's chromium system libs are available in the
  builder). Builder stage: copy `package.json`/`package-lock.json`, run `npm ci`, then
  `npx playwright install --with-deps chromium`, copy the source, and run
  `npm run build` (this triggers the `prebuild` OG render then `astro build`, producing
  the standalone server at `dist/server/entry.mjs`). Runtime stage: a slim
  `node:22-bookworm-slim`, set `ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` and
  `NODE_ENV=production`, copy `package.json`/lockfile and run `npm ci --omit=dev`
  (the runtime server never launches chromium, so no browser is needed here), copy
  `dist` from the builder, set `ENV HOST=0.0.0.0` and `ENV PORT=3000`, `EXPOSE 3000`,
  and `CMD ["node", "./dist/server/entry.mjs"]`. The build stage needs no `GHOST_*`
  env (SSR pages are rendered on request, not prerendered). Add a `.dockerignore`
  covering `node_modules`, `dist`, `.astro`, `.git`, `.env*`, and `.planning` to keep
  the build context small. Do not hardcode `GHOST_URL`/`GHOST_CONTENT_API_KEY`; those
  come from Coolify's runtime env (Task 7).
- **Verify:** `.gitlab-ci.yml` no longer exists;
  `docker build -t jcrenshaw-site .` completes and
  `docker run --rm -e GHOST_URL=... -e GHOST_CONTENT_API_KEY=... -p 3000:3000
  jcrenshaw-site` then `curl -I http://localhost:3000` returns HTTP 200.

### Task 6: Provision the staging DNS record (DNS-only)

- **Files:** (external: Cloudflare DNS console - no repo change)
- **Action:** In Cloudflare, create an A record `staging.jcrenshaw.dev` pointing at the
  droplet `137.184.184.60`, set to DNS-only (grey cloud, not proxied). DNS-only is
  required so Coolify/Traefik can complete Let's-Encrypt issuance against the origin
  and so the browser sees the origin LE cert (DPLY-01), and it means no Cloudflare edge
  HTML cache fronts staging. The record must resolve before the Coolify deploy requests
  a certificate (LE order fails otherwise).
- **Verify:** `rtk curl -s "https://dns.google/resolve?name=staging.jcrenshaw.dev&type=A"`
  (or `dig +short staging.jcrenshaw.dev`) returns `137.184.184.60`; the Cloudflare
  record shows a grey (DNS-only) cloud.

### Task 7: Deploy the SSR site to staging via Coolify from the private repo

- **Files:** (external: Coolify console on 137.184.184.60 - no repo change; depends on Task 5 committed and Task 6)
- **Action:** First push the Phase-4 branch that holds the Tasks 1-5 commits (the
  current working branch `rebrand-to-jcrenshaw`) to the private GitHub origin
  (`rtk git push -u origin rebrand-to-jcrenshaw`) so the committed Dockerfile and
  prebuild change exist on the remote Coolify pulls from - without this push Coolify
  builds a branch with no Dockerfile. Then in Coolify (4.1.2 on the SFO3 droplet),
  create an Application resource sourced from the private GitHub repo
  `crenshawdev/jcrenshaw.dev` (authorize via a GitHub App or deploy key so Coolify can
  pull the private repo), and set the tracked branch to that exact same
  branch (`rebrand-to-jcrenshaw`) - not the repo default - with build pack = Dockerfile
  (the repo-committed Dockerfile from Task 5). Set
  the resource domain to `https://staging.jcrenshaw.dev` and let Coolify request the
  Let's-Encrypt certificate. Add runtime environment variables `GHOST_URL` (the live
  Ghost origin) and `GHOST_CONTENT_API_KEY`, and set `PORT=3000`/`HOST=0.0.0.0` to
  match the Dockerfile's exposed port. Trigger the deploy. Note the resource's deploy
  webhook URL for later use, but do not point Ghost at a redeploy webhook (D-01: no
  rebuild on publish).
- **Verify:** The Coolify deploy log shows a successful image build and a running
  container; `rtk curl -I https://staging.jcrenshaw.dev` returns HTTP 200; the Coolify
  resource status is running/healthy.

### Task 8: Validate staging HTTPS, live Ghost content, and OG assets (DPLY-01)

- **Files:** (external: verification only - no repo change; depends on Task 7)
- **Action:** Confirm the staging deploy serves the SSR site over a valid LE cert
  reading live Ghost. Load `https://staging.jcrenshaw.dev` and
  `https://staging.jcrenshaw.dev/writing` in a browser and confirm no certificate
  warning and that posts from the live Ghost appear; open a known post at
  `/posts/<slug>` and confirm its body renders from Ghost. Confirm the OG artifacts
  produced in-pipeline are served (not 404), proving the OG render ran during the
  Coolify build.
- **Verify:** `rtk curl -I https://staging.jcrenshaw.dev` returns HTTP 200 with no TLS
  error (a plain `curl`, which validates the chain, does not report a cert problem);
  `rtk curl -I https://staging.jcrenshaw.dev/tempest-og.png` returns HTTP 200;
  `rtk curl -s https://staging.jcrenshaw.dev/writing` contains the title of a post that
  exists in live Ghost.

### Task 9: Wire the Ghost publish/update webhook (AUTO-01)

- **Files:** (external: Ghost admin - no repo change; depends on Task 8)
- **Action:** In Ghost admin, create a custom Integration and add webhooks subscribing
  the events `post.published`, `post.published.edited`, and `post.unpublished`. Per
  D-01 the webhook's job is edge-cache invalidation, not a rebuild. Because staging is
  Cloudflare DNS-only (Task 6) there is no edge HTML cache in front of it, so on staging
  the webhook has nothing to purge and the automatic-update behavior is delivered by the
  SSR live read. Point the webhook at a concrete throwaway 2xx endpoint so delivery
  is exercised now: create a request bin at https://webhook.site, copy its unique URL,
  and use that as the webhook target (it returns 200 and logs each POST, so both the
  Ghost delivery and the event payload are inspectable). This is deliberately a
  placeholder: the real Cloudflare cache-purge API target is an explicit Phase 5
  deliverable, attached when the Cloudflare Pro proxy is turned on at apex cutover, which
  is when the edge cache the purge acts on first exists. Record that handoff so the
  deferral is intentional, not an undefined field. Do not configure the webhook to trigger a Coolify
  redeploy (D-01: no redeploy on publish).
- **Verify:** Publish a throwaway test post in Ghost with no manually-run build or
  deploy, then within a request or two
  `rtk curl -s https://staging.jcrenshaw.dev/writing` shows the new post and
  `rtk curl -I https://staging.jcrenshaw.dev/posts/<test-slug>` returns HTTP 200; the
  Ghost integration's webhook delivery log shows a 2xx for the `post.published` event.
  Unpublish/delete the test post afterward.

## Notes

- Human-required, no repo values Claude can supply: the GitHub App/deploy-key
  authorization for the private repo (Task 7), the live `GHOST_URL` and
  `GHOST_CONTENT_API_KEY` values (Task 7), the Cloudflare DNS edit (Task 6), and the
  Ghost admin webhook configuration (Task 9).
- `astro.config.mjs` `site` stays `https://jcrenshaw.dev`; on staging that means
  canonical and absolute OG URLs point at the apex (the intended canonical target).
  This does not affect any Phase 4 acceptance check and is left unchanged to avoid a
  staging-only build divergence.
- The Tempest OG card version (Task 3) is resolved at render/build time, so
  `public/tempest-og.png` tracks the live release only as of the last Coolify build,
  not instantly. Because D-01 forbids rebuild-on-publish and D-02 forbids
  cross-repo redeploy-on-release, a new Tempest tag refreshes the SSR code-page badge
  within the TTL (Task 1) but leaves the OG social-preview image on the prior version
  until the next deploy. This staleness window is an intentional consequence of the
  locked build-artifact decision (D-03), not a gap; a rebuild-on-release trigger is out
  of scope for Phase 4.
- `CLAUDE.md` still documents the `.gitlab-ci.yml` deploy under "Gotchas"; that note
  goes stale when Task 5 removes the file. Refreshing project docs is not a Phase 4
  acceptance item and is left for the Phase 5 doc pass (`PROJECT.md` Infra section is
  also flagged stale in D-05).
