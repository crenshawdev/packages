---
status: complete
phase: 4
sources: [CONTEXT.md, ROADMAP.md, SUMMARY.md]
started: 2026-07-14T12:03:16Z
updated: 2026-07-14T12:03:16Z
---

## Items

### 1. Cold-start smoke test
expected: Deploy from a clean state (fresh container build + boot on the droplet), then load staging - the node-standalone server boots clean, the prebuild OG render completes, and one primary page (e.g. `/writing`) returns live Ghost data on the first request.
status: pass
reported: "did several cold redeploys"

### 2. Publish -> live, no manual step
expected: Publishing a test post in Ghost makes it appear on staging with no manually-run build or deploy: load staging `/writing` and the post's `/posts/<slug>` and both show the new post.
status: skipped
reason: Already validated live 2026-07-14 (SUMMARY Task 9: `webhook-test-0714` appeared zero-touch on staging /writing and /posts/, then deleted); user skipped re-publishing a throwaway post.

### 3. Live Tempest version, no hardcoded string
expected: Staging code page and home "latest code" show the current latest Tempest release tag read live from GitHub (matches latest release on `github.com/crenshawdev/tempest`); `grep` finds no hardcoded version string in `src/pages/code/tempest.astro` or `og/tempest-card.html`.
status: pass
source: verifier
evidence: tempest.astro:3,5,23 imports/awaits getLatestCode and renders {tempest.version} (no static badge); og/tempest-card.html:226 uses {{TEMPEST_VERSION}} placeholder substituted live by og/render-og.mjs:17-37,60; src/lib/latestCode.ts:7-10,64-69 fetches GitHub tags on a 10-min TTL. Only version-shaped strings left are historical prose (tempest.astro:34 "2.6.0") and the labeled live:false fallback (latestCode.ts:18), not rendered display values.

### 4. OG cards are build artifacts, not committed
expected: A build from a clean checkout produces `og-image.png`, `tempest-og.png`, `weathervane-og.png` at 1200x630 as build artifacts; `git ls-files public` shows those PNGs are no longer committed.
status: pass
source: verifier
evidence: `git ls-files public` lists only apple-touch-icon.png and icon-512.png; the three OG PNGs absent. .gitignore:16-18 ignores them; package.json:8 prebuild runs og/render-og.mjs; package.json:18 playwright ^1.61.1 is a real dependency.

### 5. Coolify deploys SSR from private repo via Dockerfile
expected: Coolify builds and deploys the SSR site from the private GitHub repo using the committed Dockerfile; the running staging deploy serves pages containing live Ghost content.
status: pass
reported: "just went to the site" - live and serving; build recipe (Dockerfile, chromium, node-standalone, .gitlab-ci.yml removed) verified in-repo by cad-verifier.

### 6. Staging HTTPS over valid Let's-Encrypt cert
expected: `curl -I` against the staging host returns HTTP 200 over a valid Let's-Encrypt certificate (no cert warning in a browser), reading live Ghost.
status: pass
reported: "just went to the site" - loaded in browser with no cert warning; SUMMARY Task 8 recorded HTTP/2 200 over a verified Let's-Encrypt chain (issuer CN=YR2).

## Summary

total: 6
passed: 5
failed: 0
pending: 0
skipped: 1
blocked: 0
