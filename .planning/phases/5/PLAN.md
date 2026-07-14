---
phase: 5
plan: 1
requirements: [DPLY-02]
files:
  - CLAUDE.md
  - .planning/PROJECT.md
---

# Phase 5: Go live - Plan

## Goal

jcrenshaw.dev is publicly live over HTTPS behind Cloudflare Pro, served by the
automated pipeline end to end: apex cut over to the SSR droplet, deploy-on-push
wired, the real Cloudflare cache-purge target in place, and www redirecting to apex.

## Must be true when done

- `curl -sI https://jcrenshaw.dev` returns HTTP 200 over a valid cert with no browser
  warning, and the body is SSR live-Ghost content from the droplet, not the old GitLab
  Pages static site.
- Cloudflare SSL/TLS mode is Full (Strict) and the proxied apex returns no 525/526
  origin-TLS errors.
- Publishing a post in Ghost makes it appear on the live apex `/writing` and
  `/posts/<slug>` with no manually-run build or deploy step.
- A push to the deploy branch triggers a Coolify redeploy with no manual click, and the
  pushed change appears live on the apex.
- `curl -sI https://www.jcrenshaw.dev` returns a 301 to `https://jcrenshaw.dev`.
- The `Staging cache purge` Ghost integration's Target URL is the real Cloudflare
  purge endpoint (not webhook.site) and returns a success status on a publish event.
- `CLAUDE.md` and `.planning/PROJECT.md` no longer reference the removed
  `.gitlab-ci.yml`, GitLab Pages, or the retired NYC1 `167.99.0.56` droplet.

## Context

- Locked decisions D-01..D-05 in `phases/5/CONTEXT.md` are authoritative. D-01: repoint
  the already-proxied apex A record to the droplet `137.184.184.60`, keep the proxy on.
  D-02: issue the origin cert via the proven staging path (grey-cloud during LE
  issuance, verify HTTPS, then flip proxy on with SSL Full (Strict)). D-03: repoint the
  EXISTING `Staging cache purge` Ghost integration's Target URL (currently webhook.site)
  to the real Cloudflare purge endpoint; mechanism is the planner's call. D-04: also
  land the deferred Coolify deploy-on-push webhook, a www->apex 301, and the stale-doc
  fixes. D-05: `astro.config.mjs` already sets `site: 'https://jcrenshaw.dev'` - no
  change.
- Cache-purge mechanism (D-03 call): Ghost custom-integration webhooks send only a
  signed JSON payload and cannot set the `Authorization: Bearer` header that Cloudflare's
  `POST /zones/{id}/purge_cache` requires, so the direct-webhook path is not viable and
  the Worker intermediary (flagged assumption 1) is the chosen mechanism.
- HTML is not edge-cached (SSR reads Ghost live per request, `cf-cache-status: DYNAMIC`),
  so the purge refreshes only static/OG assets and does NOT gate go-live.
- External-console tasks mirror the Phase 4 Tasks 6-9 shape: exact values, a falsifiable
  curl/dig check each. The only in-repo change is Task 1's doc fixes.
- Ordering: Task 1 is independent. Tasks 2->3 are the sequential TLS cutover and gate the
  live apex. Task 4's "change appears live" check and Task 5's edge-cache purge both
  require the proxy flipped on (Task 3). Task 6 is best verified once the apex is live.
- Out of scope: paid members / Stripe, download counters / analytics, any design/copy
  change.

## Tasks

### Task 1: Fix the stale deploy docs

- **Files:** CLAUDE.md, .planning/PROJECT.md
- **Action:** These docs still describe the retired static/GitLab-Pages stack and the
  retired droplet. In `CLAUDE.md`: rewrite the header line 3 ("Astro 6 static site for
  jcrenshaw.dev ... deployed to GitLab Pages.") to describe the current reality - an
  Astro 6 SSR site (server output + Node adapter) served by Coolify on the DO droplet
  behind Cloudflare Pro; and rewrite the `## Gotchas` bullet that references the removed
  `.gitlab-ci.yml`/GitLab Pages CI (the `mv dist public` + "commit regenerated OG PNGs"
  bullet) to describe the current deploy: Coolify builds the repo Dockerfile on push,
  the `prebuild` step renders OG cards in-pipeline (they are untracked build artifacts,
  no longer committed). Keep the `trailingSlash: 'never'` gotcha as-is. In
  `.planning/PROJECT.md` Context > Infra (line 58): replace the retired droplet identity
  `167.99.0.56` with `137.184.184.60` and `NYC1` with `SFO3` (both are user-confirmed in
  phase 4 CONTEXT D-05: "The live target is the SFO3 droplet `137.184.184.60`"). Before
  writing `SFO3`, confirm the region at execution time via the DO console or
  `doctl compute droplet get 137.184.184.60 --format Region` (verify-before-claiming-infra);
  if the region cannot be verified then, drop the region token entirely rather than assert
  it. Also drop the stale
  `(private 10.116.0.2)` clause rather than carry the retired droplet's private IP (no
  verified SFO3 private IP to substitute). Reconcile the RAM to the D-05-confirmed size:
  the NYC1 line reads `4GB`, but phase 4 CONTEXT D-05 confirms the SFO3 box is `8GB` -
  write `8GB`. The remaining NYC1-specific specs (`2vCPU`, `80GB`, `$24/mo`) are the
  retired box's, not the SFO3 droplet's: verify each at execution time
  (`doctl compute droplet get 137.184.184.60 --format Memory,VCPUs,Disk,Region,Size`) and
  correct it, or drop the token if it cannot be verified - do not carry a retired droplet's
  spec onto the live one, and do not invent a replacement. Surgical edits only; touch
  nothing else.
- **Verify:** `rtk grep -n "gitlab-ci\|GitLab Pages\|167\.99\.0\.56\|NYC1\|10\.116\.0\.2"
  CLAUDE.md .planning/PROJECT.md` returns no matches; `rtk grep -n "137\.184\.184\.60\|SFO3"
  .planning/PROJECT.md` shows the corrected values.

### Task 2: Repoint the apex to the droplet grey-cloud and issue the origin LE cert

- **Files:** (external: Cloudflare DNS console + Coolify console on 137.184.184.60 - no repo change)
- **Action:** First, in Coolify's SSR Application resource (the one already serving
  `staging.jcrenshaw.dev`), add `https://jcrenshaw.dev` to the resource Domains list
  alongside the staging domain so Traefik requests a Let's-Encrypt cert for the apex.
  Then, in Cloudflare DNS for the jcrenshaw.dev zone, edit the EXISTING apex
  `jcrenshaw.dev` A record: change its target from the old GitLab Pages origin to
  `137.184.184.60`, and toggle it to DNS-only (grey cloud) temporarily. Grey-cloud is
  required so Traefik's ACME HTTP-01 challenge reaches the origin (flagged assumption 2 -
  the challenge must complete before the proxy goes on). Remove any additional apex
  `A`/`AAAA`/`CNAME` records still pointing at the old origin so all apex traffic
  resolves to the droplet. Redeploy or restart the Coolify app if needed to trigger LE
  issuance. Do NOT flip the proxy on yet - that is Task 3.
- **Verify:** `dig +short jcrenshaw.dev` returns only `137.184.184.60` (the origin IP,
  not a Cloudflare 104.x/172.x proxy IP); `curl -sI https://jcrenshaw.dev` returns HTTP
  200 and `curl -v https://jcrenshaw.dev 2>&1 | rtk grep "issuer"` shows a Let's-Encrypt
  issuer (e.g. CN=R10/R11), not the Traefik default cert; the response body is SSR live
  Ghost (contains the site chrome / a current post), not the old GitLab Pages markup.

### Task 3: Prepare the zone, then flip the apex proxy on with SSL Full (Strict)

- **Files:** (external: Cloudflare DNS + SSL/TLS + Rules console - no repo change; depends on Task 2)
- **Action:** Do ALL zone preparation while the apex is still grey-cloud from Task 2
  (a grey-cloud record is unaffected by the zone SSL mode, so there is no live window under
  the legacy mode - this ordering is D-02: set Full (Strict) BEFORE the apex is proxied).
  Steps, in order:
  1. **Enumerate proxied origins.** Full (Strict) is ZONE-WIDE, not apex-scoped: every
     currently-proxied hostname whose origin lacks a valid cert will return 526 the instant
     the mode flips. List the zone's DNS records and confirm each Proxied (orange-cloud)
     record either presents a valid origin cert or is grey-cloud. In particular confirm
     `ghost.jcrenshaw.dev` (the shared origin on the same droplet) and
     `staging.jcrenshaw.dev` are grey-cloud (Phase 4) or serve a valid cert.
  2. **Audit legacy cache rules.** The apex previously served a static GitLab Pages site
     behind this same Cloudflare zone, which commonly carries a Page Rule or Cache Rule
     that caches HTML ("Cache Everything"). In Rules > Page Rules AND Rules > Cache Rules,
     enumerate every rule matching `jcrenshaw.dev`/the apex and remove or disable any rule
     that caches HTML, so apex HTML stays uncached (`cf-cache-status: DYNAMIC`). If a
     stale HTML-caching rule survives, a Task 4 push or a Ghost publish would redeploy the
     origin but the edge keeps serving stale HTML with no purge - the change silently
     never appears live. This audit is what makes the D-01/D-03 "HTML is DYNAMIC" premise
     actually hold on the proxied apex, not just on grey-cloud staging.
  3. **Set Full (Strict).** In Cloudflare SSL/TLS > Overview set the zone encryption mode
     to Full (Strict) - NOT Flexible: Flexible leaves the CF->origin hop unencrypted and
     creates a redirect loop against Coolify/Traefik's forced HTTP->HTTPS (flagged
     assumption 2); Full (Strict) validates the origin LE cert (from Task 2) end to end.
  4. **Flip the apex Proxied.** Only now toggle the apex `jcrenshaw.dev` A record to
     Proxied (orange cloud). It immediately serves under Full (Strict) with its already-valid
     LE cert. Confirm Universal SSL presents a valid edge cert for the apex.
- **Verify:** `dig +short jcrenshaw.dev` now returns Cloudflare proxy IPs (104.x/172.x);
  `curl -sI https://jcrenshaw.dev` returns HTTP 200 with a `cf-ray` and `server: cloudflare`
  header and NO 525/526 status; `curl -sI https://jcrenshaw.dev/writing` shows
  `cf-cache-status: DYNAMIC` (apex HTML not edge-cached, confirming no legacy Cache-Everything
  rule survived); a browser load of https://jcrenshaw.dev shows a valid cert with no warning
  and the SSR live-Ghost site, not the old GitLab Pages static site.

### Task 4: Wire the Coolify deploy-on-push webhook into GitHub

- **Files:** (external: Coolify console + GitHub repo settings - no repo change; verify depends on Task 3)
- **Action:** Close the deferred AUTO-04 Stage F. In Coolify, on the apex SSR
  Application resource, open its Webhooks/Deploy section and copy the per-resource deploy
  webhook URL and its secret. In the GitHub repo `crenshawdev/jcrenshaw.dev` > Settings >
  Webhooks, add a webhook: Payload URL = the Coolify deploy URL, Content type =
  `application/json`, Secret = the Coolify secret, trigger = push events. Ensure Coolify's
  resource is set to auto-deploy on webhook for the tracked deploy branch
  (`rebrand-to-jcrenshaw`). Content publishing is already zero-touch via SSR; this closes
  the code/design-push half of the automated pipeline.
- **Verify:** push a trivial commit to the deploy branch; Coolify shows a new deployment
  triggered automatically (no manual "Deploy" click) within ~1 minute, and after it
  finishes the pushed change is live at https://jcrenshaw.dev; the GitHub webhook's
  Recent Deliveries shows a 2xx response from Coolify.

### Task 5: Repoint the Ghost cache-purge integration to the real Cloudflare purge endpoint

- **Files:** (external: Cloudflare Workers/API + Ghost integration console - no repo change; verify depends on Task 3)
- **Action:** Replace the webhook.site placeholder Target URL on the EXISTING
  `Staging cache purge` Ghost integration with a real Cloudflare purge target, keeping
  the integration and its three event subscriptions (`post.published`,
  `post.published.edited`, `post.unpublished`) intact - only the Target URL changes
  (D-03). Because Ghost webhooks cannot set an `Authorization` header, stand up a small
  Cloudflare Worker as the intermediary (flagged assumption 1): (1) create a scoped
  Cloudflare API token limited to Zone > Cache Purge on the jcrenshaw.dev zone; (2)
  create a Worker that on POST calls
  `https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache` with header
  `Authorization: Bearer {token}` and JSON body `{"purge_everything": true}`, reading the
  token and zone id from Worker secrets/vars. The Worker route is public and calls
  `purge_everything` on the whole zone, so it MUST authenticate every inbound request
  (this is a secrets/untrusted-input surface): reject with 401 any POST that does not
  carry a mandatory shared secret - a secret path segment or query param the Worker
  compares against a Worker secret (`env.PURGE_SECRET`), and/or verifying the Ghost webhook
  signature. Do not ship the guard as optional: an unauthenticated endpoint that triggers
  zone-wide purges can be POSTed in a loop for a cache-busting DoS. Embed the secret in the
  Ghost Target URL so only Ghost knows it. (3) Deploy the Worker to a route. Then in Ghost,
  edit each of the three webhooks' Target URL to the Worker URL (secret included).
  Purge-everything is sufficient: apex HTML is DYNAMIC (confirmed uncached in Task 3, no
  legacy Cache-Everything rule), so the purge only refreshes static/OG assets.
- **Verify:** `curl -X POST` against the Worker route WITHOUT the shared secret returns
  `401` and fires no purge (auth is mandatory, not optional); then publish a test post in
  Ghost and the purge fires successfully - confirm via the Worker log (`wrangler tail`
  shows a `{"success":true}` Cloudflare response) or the Ghost integration's webhook
  delivery showing a 2xx; the test post appears at
  https://jcrenshaw.dev/writing and https://jcrenshaw.dev/posts/<slug> (HTTP 200) with no
  manual deploy; `curl -sI https://jcrenshaw.dev/tempest-og.png` shows `cf-cache-status:
  MISS` immediately after the purge. Delete the test post afterward.

### Task 6: Add the www->apex 301 redirect

- **Files:** (external: Cloudflare DNS + Rules console - no repo change; verify best after Task 3)
- **Action:** `www.jcrenshaw.dev` has no record today. In Cloudflare DNS add a Proxied
  record for `www` so the hostname resolves through the edge - a Proxied A record `www`
  -> `137.184.184.60`, or a Proxied CNAME `www` -> `jcrenshaw.dev`. Then add a Redirect
  Rule (Rules > Redirect Rules) matching hostname `www.jcrenshaw.dev` that issues a 301
  to the apex preserving the path and query string, status code 301. Use a DYNAMIC target
  that preserves the path - `concat("https://jcrenshaw.dev", http.request.uri.path)` (add
  the query string if desired). Do NOT use a static `https://jcrenshaw.dev` target: a
  static target drops the request path, so `www.jcrenshaw.dev/writing` would 301 to
  `https://jcrenshaw.dev/` and fail this task's path-preserving verify. Keep it a
  Cloudflare edge rule; no origin change.
- **Verify:** `curl -sI https://www.jcrenshaw.dev` returns `HTTP/2 301` with `location:
  https://jcrenshaw.dev/`; `curl -sI https://www.jcrenshaw.dev/writing` returns 301 with
  `location: https://jcrenshaw.dev/writing` (path preserved).

## Notes

- Human-required credentials Claude cannot obtain: the Cloudflare API token (Zone > Cache
  Purge scope) and zone id for Task 5, the Coolify deploy-webhook secret for Task 4, and
  console access to Cloudflare, Coolify, and Ghost admin. These are John's console steps,
  the same as Phase 4 Tasks 6-9.
- Sequencing reality: Task 2 must fully verify (origin HTTPS good) before Task 3 flips the
  proxy - flipping before the LE cert exists yields a 525/526. Tasks 4-6 assume the apex
  is live (post-Task 3).
