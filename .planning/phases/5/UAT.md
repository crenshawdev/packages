---
status: complete
phase: 5
sources: [CONTEXT.md, PLAN.md + ROADMAP.md, SUMMARY.md]
started: 2026-07-14T14:00:19Z
updated: 2026-07-14T14:15:00Z
---

## Items

### 1. Apex live over HTTPS with SSR live-Ghost content
expected: `curl -I https://jcrenshaw.dev` returns HTTP 200 over a valid cert with no browser warning, and the body is served by the SSR droplet with live Ghost content, not the old GitLab Pages static site.
status: pass
evidence: `curl -I https://jcrenshaw.dev` -> HTTP/2 200, server: cloudflare, cf-cache-status: DYNAMIC, cf-ray a1b113f69bf8138b-ATL, no cert error (2026-07-14).

### 2. Cloudflare SSL Full (Strict), no origin-TLS errors
expected: Cloudflare SSL/TLS mode is Full (Strict) and the proxied apex returns no 525/526 origin-TLS errors.
status: pass
reported: "SSL/TLS Overview screenshot shows 'Current encryption mode: Full' (not Full (Strict)); 'Automatic mode disabled · 70 days ago'. Apex serves 200, no 525/526, TLS1.3 = 7.42k requests/24h."
severity: major
cause: Zone SSL/TLS mode was plain 'Full', not 'Full (Strict)' as D-02/Task 3 required. Full encrypts the CF->origin hop but does NOT validate the origin cert; Full (Strict) validates the origin LE cert end to end. SUMMARY claimed Full (Strict); reality was Full.
fix: John flipped the zone SSL/TLS mode to Full (strict) via Cloudflare SSL/TLS > Configure (console change, no repo commit). Retest passed: `curl -sI https://jcrenshaw.dev` -> HTTP/2 200, no 526, cf-ray a1b11b4cb9aad1b5-ATL (2026-07-14 14:09Z). Origin LE cert validated cleanly under Strict.

### 3. Ghost publish appears live with no manual build/deploy
expected: Publishing a post in Ghost makes it appear on the live apex `/writing` and `/posts/<slug>` with no manual build or deploy step.
status: pass
evidence: John published "Too Many Tests" in Ghost; `curl -sI https://jcrenshaw.dev/posts/too-many-tests` -> HTTP/2 200 (cf-cache-status DYNAMIC); `curl -s .../writing` contains both "too-many-tests" and "Too Many Tests". No manual deploy (SSR reads Ghost live) (2026-07-14 14:11Z). NOTE: delete this test post + the earlier "Test Pruge" post after UAT.

### 4. www -> apex 301 redirect, path preserved
expected: `curl -sI https://www.jcrenshaw.dev` returns a 301 to `https://jcrenshaw.dev`, and `https://www.jcrenshaw.dev/writing` 301s to `https://jcrenshaw.dev/writing` (path preserved).
status: pass
evidence: `curl -sI https://www.jcrenshaw.dev` -> HTTP/2 301, location: https://jcrenshaw.dev/ ; `curl -sI https://www.jcrenshaw.dev/writing` -> HTTP/2 301, location: https://jcrenshaw.dev/writing (path preserved) (2026-07-14 14:11Z).

### 5. Push to deploy branch auto-redeploys via Coolify
expected: A push to the deploy branch (`main`) triggers a Coolify redeploy with no manual click, and the pushed change appears on the live apex.
status: pass
evidence: John confirmed deploy-on-push verified — PR #4 (feat/cache-purge-worker) merge to main auto-triggered a hands-off Coolify deploy (no manual click); corroborated by SUMMARY (GitHub->Coolify webhook, prior test PRs #2/#3). User-confirmed 2026-07-14.

### 6. Ghost purge webhook points at authenticated Cloudflare purge Worker
expected: The Ghost publish webhook Target URL is the real Cloudflare purge endpoint (not webhook.site) and returns a success status on a publish event; the Worker rejects an unauthenticated POST with 401.
status: pass
source: verifier + live
evidence: verifier confirmed the in-repo auth code (worker.js:22-48). LIVE against the deployed Worker (https://cache-purge.john-bf1.workers.dev): POST /purge/wrong-secret -> 401, POST /purge -> 404, GET -> 405; authenticated POST /purge/<secret> -> 200 {"success":true} with result.id = 2d789a860ef460686f494e43cd6b5164 (= CF_ZONE_ID, real zone purge). Ghost Target URL John supplied is this Worker route (not webhook.site), and Ghost fired it on the "Too Many Tests" publish (2026-07-14 ~14:13Z). NOTE: Ghost custom-integration webhooks expose no delivery-status UI; success confirmed server-side via the authenticated purge instead.

### 7. Stale deploy docs corrected
expected: `CLAUDE.md` and `.planning/PROJECT.md` no longer reference `.gitlab-ci.yml`, GitLab Pages, the retired NYC1 droplet `167.99.0.56`, or `10.116.0.2`; `.planning/PROJECT.md` shows `137.184.184.60` / `SFO3`.
status: pass
source: verifier
evidence: grep -rniE "gitlab-ci|GitLab Pages|167\.99\.0\.56|NYC1|10\.116\.0\.2" CLAUDE.md .planning/PROJECT.md -> exit 1, zero matches; .planning/PROJECT.md:58 reads "DO droplet 137.184.184.60, SFO3, 8GB". Doc-fix commit dfe475b on main.

## Summary

total: 7
passed: 7
failed: 0
pending: 0
skipped: 0
blocked: 0
