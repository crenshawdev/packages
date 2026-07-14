# Phase 4: Automation pipeline - Context

Gathered: 2026-07-13
Feeds: /cad-plan 4

## Scope boundary

In: Make the site self-updating. Wire Coolify to build+deploy the SSR site from the
private GitHub repo via a committed Dockerfile; validate it on a staging subdomain over
real Let's-Encrypt HTTPS reading live Ghost. Retire the hand-committed OG PNGs by running
`render-og.mjs` as a pre-build pipeline step (Playwright as a real dep). Refresh the code
page's Tempest version live (TTL fetch + de-hardcode). Wire a Ghost publish/update webhook
that purges edge cache (content is already live via SSR).

Out: Apex cutover to `jcrenshaw.dev` and Cloudflare Pro go-live (Phase 5, DPLY-02).
Site-visit analytics/counters (deferred to a separate Cloudflare R2 + Worker + Analytics
Engine project; the public site shows no counters). Any design/copy change. Paid members.

Deferred: None.

Plan shape: multiple plans (app-code/build recipe; Coolify deploy + staging HTTPS; webhook
wiring) - /cad-plan breaks it down.

## Decisions

- D-01 (Publish->live, AUTO-01): The Ghost publish/update webhook triggers a cache purge
  only, no rebuild. The SSR front end reads the Ghost Content API live on every request, so
  a published post is live on the next request; the webhook's job is to invalidate any edge
  cache in front of the origin. No redeploy on publish. Evidence: `src/lib/content.ts`
  (per-request fetch, no cache); `astro.config.mjs` `output:'server'`, no `prerender` in
  `src/pages/`.
- D-02 (Release->code, AUTO-02): Live fetch + de-hardcode. Add a short TTL to
  `src/lib/latestCode.ts` so the running SSR server re-fetches the GitHub tags (its current
  module-scope memo has no TTL and its "at build time" comment is stale under SSR); replace
  the hardcoded version badge in `src/pages/code/tempest.astro` (v2.9.0) and the OG card
  version in `og/tempest-card.html` (2.11.0) so both track the live release. No cross-repo
  redeploy trigger required. Evidence: `latestCode.ts:21,59`; `code/tempest.astro`;
  `og/tempest-card.html:226`.
- D-03 (OG regen, AUTO-03): Retire the hand-committed OG PNGs. Add Playwright/chromium as a
  real project dependency and run `node og/render-og.mjs` as a pre-`astro build` pipeline
  step so the three cards (`og-image.png`, `tempest-og.png`, `weathervane-og.png`) are build
  artifacts, not committed files. A failed render fails the build, so the prior good deploy
  keeps serving (safe failure mode). Evidence: `og/render-og.mjs:5` imports `playwright`
  (absent from `package.json`/lockfile); PNGs currently committed (not gitignored);
  `PROJECT.md` names the hand-render as the anti-pattern this phase retires.
- D-04 (Deploy recipe, AUTO-04): Coolify deploys the SSR site from the private GitHub repo
  via a repo-committed Dockerfile (chosen over Nixpacks because the OG step needs a chromium
  binary in the image), running the Astro node-standalone server as a long-lived process;
  the dead `.gitlab-ci.yml` static-deploy path is removed/replaced. `GHOST_URL` and
  `GHOST_CONTENT_API_KEY` are provisioned in Coolify's deploy environment. Evidence:
  `astro.config.mjs` `output:'server'` + `@astrojs/node` standalone; no Dockerfile/Nixpacks
  in repo; `.gitlab-ci.yml` flagged stale in `phases/1/SUMMARY.md`.
- D-05 (Deploy target): The live target is the SFO3 droplet `137.184.184.60` (8GB) running
  Coolify 4.1.2, the same box as Ghost. The NYC1 `167.99.0.56` box named in `PROJECT.md` is
  deleted; `PROJECT.md`'s Infra section is stale and needs a later fix. Evidence:
  `phases/2/SUMMARY.md`; user confirmation this session.
- D-06 (Staging, DPLY-01): Validate on a staging subdomain (e.g. `staging.jcrenshaw.dev`)
  over real Coolify/Let's-Encrypt HTTPS reading live Ghost, before any apex cutover. The DNS
  record must resolve first for LE issuance. Evidence: deploy-order constraint in
  `PROJECT.md`; `astro.config.mjs:5` `site:'https://jcrenshaw.dev'`.

## Acceptance criteria

- [ ] After the Ghost webhook is configured, publishing a test post in Ghost makes it appear
      on the staging site with no manually-run build or deploy step (verify: publish, then
      load staging `/writing` and the post's `/posts/<slug>`).
- [ ] The staging code page and home "latest code" show the current latest Tempest release
      tag read live from GitHub (matches the actual latest release on
      `github.com/crenshawdev/tempest`); `grep` finds no hardcoded version string in
      `src/pages/code/tempest.astro` or `og/tempest-card.html`.
- [ ] A build from a clean checkout produces `og-image.png`, `tempest-og.png`, and
      `weathervane-og.png` (1200x630) as build artifacts; `git ls-files public` shows those
      PNGs are no longer committed.
- [ ] Coolify builds and deploys the SSR site from the private GitHub repo using the
      committed Dockerfile; the running staging deploy serves pages containing live Ghost
      content.
- [ ] `curl -I` against the staging host returns HTTP 200 over a valid Let's-Encrypt
      certificate (no cert warning in a browser), reading live Ghost.

## Flagged assumptions

- Cloudflare Pro caching in front of the staging/apex origin - Unclear; if wrong: a publish
  could sit behind a stale edge HTML cache. Phase 2 recorded Cloudflare grey-cloud (DNS-only)
  for the Ghost host; if the site host is also DNS-only there is no edge HTML cache and the
  D-01 purge is effectively a no-op (content simply live via SSR). The planner confirms the
  proxy/cache mode for the site host and shapes the webhook target accordingly.
- Coolify deploy mechanics (external, planner lays out concrete steps John executes with real
  values): private-repo auth (GitHub App vs deploy key), the per-resource deploy/purge
  webhook URL, and how chromium is provisioned into the build image.
- Ghost webhook configuration (external): which events (`post.published`,
  `post.published.edited`, `post.unpublished`) to subscribe and the payload/target-URL shape.
- Staging `site` URL: `astro.config.mjs` `site:'https://jcrenshaw.dev'` means canonical/OG
  URLs on staging point at the apex unless overridden for the staging build - planner detail
  to confirm against desired staging behavior.
