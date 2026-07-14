---
phase: 4
status: partial
completed: 2026-07-13
---

# Phase 4: Automation pipeline - Summary

The in-repo automation slice shipped (live-fetch versioning, in-pipeline OG
regeneration, and a Coolify Dockerfile replacing the dead GitLab CI); the
external staging deploy and webhook wiring (Tasks 6-9) remain John's console work.

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

## Open items

- Tasks 6-9 are external console work for John, not yet done (this is why status is
  `partial`, not `complete`):
  - Task 6 - Cloudflare: A record `staging.jcrenshaw.dev` -> `137.184.184.60`, DNS-only (grey cloud).
  - Task 7 - push branch `rebrand-to-jcrenshaw` to the private GitHub origin, then in
    Coolify create the Application on that branch (build pack = Dockerfile), domain
    `https://staging.jcrenshaw.dev`, runtime env `GHOST_URL` + `GHOST_CONTENT_API_KEY` +
    `PORT=3000`/`HOST=0.0.0.0`, deploy.
  - Task 8 - validate: `curl -I https://staging.jcrenshaw.dev` -> 200 over valid LE cert;
    `/tempest-og.png` -> 200; `/writing` shows a live-Ghost post.
  - Task 9 - Ghost admin: custom Integration webhook on `post.published` /
    `post.published.edited` / `post.unpublished` -> a `webhook.site` bin (placeholder;
    real Cloudflare purge target is Phase 5).
- Stale docs flagged for a Phase 5 pass: `CLAUDE.md` Gotchas still references the
  now-removed `.gitlab-ci.yml`; `PROJECT.md` Infra names the retired NYC1 droplet (D-05).
- Pre-existing untracked `RESUME.md` left untouched (not a Phase 4 artifact).

## Goal check

The five commits deliver the code half of the phase goal and pass an advisory diff
review with no findings: AUTO-02 (release -> code page) is met by the TTL live fetch
and de-hardcoded badge/card; AUTO-03 (in-pipeline OG) is met by the prebuild step with
untracked PNGs; AUTO-04's build recipe (Coolify Dockerfile from the private repo) is
committed. But the phase goal as written - "self-updating ... validated on a staging
subdomain over real HTTPS" - is NOT yet achieved: AUTO-01 (Ghost webhook), DPLY-01
(staging LE HTTPS reading live Ghost), and the running Coolify deploy all depend on
Tasks 6-9, which are John's external console steps and remain open. The docker build
itself is unverified until run in an environment with Docker. This phase is
code-complete but not deploy-complete; verification should wait until staging is stood up.
