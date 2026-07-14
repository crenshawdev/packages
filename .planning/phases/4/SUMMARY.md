---
phase: 4
status: complete
completed: 2026-07-14
---

# Phase 4: Automation pipeline - Summary

The site is self-updating on staging: SSR reads live Ghost, a Ghost publish
webhook fires, OG cards regenerate in-pipeline, and Coolify deploys the SSR site
from the private repo over a valid Let's-Encrypt cert at https://staging.jcrenshaw.dev.
The in-repo slice (Tasks 1-5) and John's external console steps (Tasks 6-9) are both done.

## What shipped

- TTL-cached release fetch so the long-lived SSR server re-fetches the latest
  Tempest tag (10-min TTL) instead of freezing at boot - `src/lib/latestCode.ts`
- Live Tempest version on the code page badge and in the OG card, no hardcoded
  string left - `src/pages/code/tempest.astro`, `og/tempest-card.html` (`{{TEMPEST_VERSION}}`)
- OG cards regenerated in-pipeline via a `prebuild` step with Playwright as a real
  dependency; the three PNGs are untracked build artifacts - `package.json`,
  `og/render-og.mjs`, `.gitignore`
- Multi-stage Coolify Dockerfile (chromium in the build stage, node-standalone
  server at runtime) replacing the removed `.gitlab-ci.yml` - `Dockerfile`, `.dockerignore`

## Commits

| Plan | Task | Commit | Description |
|---|---|---|---|
| 1 | 1 | 79839bd | TTL-cache latest release fetch for long-lived SSR |
| 1 | 2 | c12b9bb | render Tempest badge from live release version |
| 1 | 3 | d3c6d0e | render OG card version from live Tempest tag |
| 1 | 4 | 2a840a7 | regenerate OG cards in prebuild instead of committing them |
| 1 | 5 | eecfb33 | replace GitLab Pages CI with Coolify Dockerfile |

## Deviations

- [deviation] Task 5 (eecfb33): `docker build`/`docker run` verify deferred - `docker`
  is unavailable in the execution sandbox. Dockerfile/.dockerignore written and
  `.gitlab-ci.yml` removed as planned; `npm run build` (prebuild OG render + astro
  build producing `dist/server/entry.mjs`) was run locally to exercise the image's
  build steps minus the container wrapper. Container build/run must be validated in
  John's environment (folds into Task 7).
- [deviation] Task 3 (d3c6d0e): live-render verify needs the `playwright` module not
  added until Task 4, so it was run after the Task 4 install - succeeded, fetched the
  live tag (2.11.0) with no fallback. Sequencing only.
- [deviation] Task 4 (2a840a7): `npx playwright install chromium` used its
  ubuntu24.04 fallback build on this host (Playwright doesn't officially support it);
  download and full OG render still succeeded at 1200x630. The Dockerfile base
  (`node:22-bookworm-slim`) is officially supported and won't hit the fallback.

## External console steps (Tasks 6-9) - done 2026-07-14

- Task 6 - Cloudflare A record `staging.jcrenshaw.dev` -> `137.184.184.60`, DNS-only.
  Verified: `dig` returns the origin IP (not a Cloudflare proxy IP).
- Task 7 - deployed via Coolify from private repo `crenshawdev/jcrenshaw.dev`, branch
  `rebrand-to-jcrenshaw`, using a **Deploy Key** (not a GitHub App - John's standing
  preference), build pack = Dockerfile, runtime env `GHOST_URL`/`GHOST_CONTENT_API_KEY`/
  `HOST=0.0.0.0`/`PORT=3000`. App listens on `0.0.0.0:3000`.
  - Root cause of two failed deploys: Traefik returned 503 (no healthy backend) because
    the proxy route/Ports-Exposes didn't match port 3000. Fixed by setting Ports Exposes
    = 3000 and restarting the Coolify proxy; that also unblocked LE issuance.
- Task 8 - validated (curl from this session): `https://staging.jcrenshaw.dev` -> HTTP/2
  200 over a **verified** chain; cert issuer = Let's Encrypt (CN=YR2, valid to 2026-10-12),
  not the Traefik default; `/tempest-og.png` -> 200 (in-pipeline OG served);
  `/posts/the-last-default` -> 200; `/writing` and `/code` render live Ghost + live
  Tempest tag `v2.11.0`.
- Task 9 - Ghost custom integration `Staging cache purge` with three webhooks
  (`post.published`, `post.published.edited`, `post.unpublished`) -> a `webhook.site` bin.
  Verified: publishing a test post appeared on staging `/writing` and `/posts/webhook-test-0714`
  (200) with zero manual deploy, and webhook.site logged the delivered POST (default 200).

## Open items (Phase 5 handoffs)

- Auto-deploy webhook (deploy-key Stage F): confirm Coolify's per-resource deploy webhook
  is wired into the repo's GitHub webhooks so a `git push` auto-redeploys. Verify in /cad-verify.
- AUTO-01 purge half: the webhook.site target is a placeholder. The real Cloudflare
  cache-purge API target attaches at Phase 5 apex cutover, when the Cloudflare Pro proxy
  (and thus an edge cache) first exists. On DNS-only staging there is no edge cache to purge.
- Test post `Webhook Test 0714` to be deleted from Ghost after verification.
- Stale docs for a Phase 5 pass: `CLAUDE.md` Gotchas still references the removed
  `.gitlab-ci.yml`; `PROJECT.md` Infra names the retired NYC1 droplet (D-05).
- Pre-existing untracked `RESUME.md` left untouched (not a Phase 4 artifact).

## Goal check

The phase goal is met on staging. AUTO-02 (release -> code page): TTL live fetch +
de-hardcoded badge/card, confirmed showing `v2.11.0` live. AUTO-03 (in-pipeline OG):
prebuild step with untracked PNGs, `/tempest-og.png` served 200 from the pipeline build.
AUTO-04 (Coolify deploys from private repo): deployed via Dockerfile + deploy key.
AUTO-01 (publish -> live, no manual step): proven by the zero-touch test-post publish.
DPLY-01 (staging over real LE HTTPS reading live Ghost): 200 over a verified Let's-Encrypt
cert serving live Ghost content. The one item not proven this session is the auto-deploy-
on-push webhook (Stage F), listed above for verification. Everything the acceptance
criteria named passed a live curl check.
