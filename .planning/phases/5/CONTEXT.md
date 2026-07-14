# Phase 5: Go live - Context

Gathered: 2026-07-14
Feeds: /cad-plan 5

## Scope boundary

In: Cut the apex `jcrenshaw.dev` over from the old GitLab Pages origin to the SSR
droplet (`137.184.184.60`) behind Cloudflare Pro over HTTPS, and complete the
end-to-end automation: the deferred Coolify deploy-on-push webhook (code/design pushes
auto-redeploy), the real Cloudflare cache-purge target replacing the webhook.site
placeholder, a `www`->apex 301 redirect, and the stale-doc fixes carried from Phase 4.
Out: Paid members / Stripe (v2, design-for-don't-build). Download counters / analytics
(separate R2 + Worker + Analytics Engine project). Any design/copy change.
Deferred: None.
Plan shape: Multiple plans, same phase - /cad-plan breaks it into apex TLS cutover
(D-01/D-02), automation wiring (deploy-on-push webhook + real cache-purge, D-03/D-04),
and www redirect + doc fixes. Execute with cad-executor fan-out across plans; hand
genuinely independent slices to Codex (Lane B) to parallelize.

## Decisions

- D-01 (Apex DNS cutover): Repoint the already-proxied apex A records from the old
  GitLab Pages origin to the droplet `137.184.184.60`, keeping the Cloudflare proxy
  (orange-cloud) on. "Behind Cloudflare Pro" means proxied, not DNS-only. Evidence: live
  `dig jcrenshaw.dev` returns Cloudflare proxy IPs serving the old static site;
  `phases/4/SUMMARY.md` ties the edge cache to the proxy at apex cutover; D-05 target
  `137.184.184.60`.
- D-02 (Origin TLS): Issue the origin cert via the proven staging path - point the apex
  A records grey-cloud (DNS-only) during Coolify/Traefik Let's-Encrypt issuance, verify
  HTTPS, then flip the proxy back on with Cloudflare SSL mode Full (Strict). Evidence:
  `phases/4/SUMMARY.md` Tasks 6-8 (staging LE cert issued while grey-cloud, issuer YR2);
  `PROJECT.md` "Coolify auto-HTTPS needs DNS resolving first."
- D-03 (Cache purge endpoint): Replace the webhook.site Target URL on the existing
  `Staging cache purge` Ghost integration with the real Cloudflare cache-purge endpoint
  (the integration and its 3 event subscriptions carry over unchanged; only the URL
  changes). Mechanism is the planner's call - try a direct Ghost webhook to
  `POST /zones/{id}/purge_cache` with a scoped token, fall back to a Cloudflare Worker
  only if Ghost can't send the bearer token + JSON body. HTML is not edge-cached
  (`cf-cache-status: DYNAMIC`; SSR reads Ghost live per request), so the purge refreshes
  static/OG assets and does not gate go-live. Evidence: `phases/4/SUMMARY.md` AUTO-01
  handoff; `src/lib/content.ts` per-request fetch, no cache.
- D-04 (Scope - full automation): This phase also lands the deferred Coolify
  deploy-on-push webhook (code/design pushes auto-redeploy, closing the goal's "served by
  the automated pipeline end to end"), a `www`->apex 301 as a Cloudflare redirect rule
  (`www.jcrenshaw.dev` has no record today), and the stale-doc fixes: `CLAUDE.md` Gotchas
  still references the removed `.gitlab-ci.yml`; `PROJECT.md` Infra names the retired NYC1
  `167.99.0.56` droplet. Evidence: `phases/4/SUMMARY.md` "Open items (Phase 5 handoffs)";
  live `dig` shows no `www` record; `PROJECT.md` automation-non-negotiable constraint.
- D-05 (Canonical URL): No change needed at cutover - `astro.config.mjs` already sets
  `site: 'https://jcrenshaw.dev'`, so canonical/OG/RSS URLs already point at the apex.
  Evidence: `astro.config.mjs`.

## Acceptance criteria

- [ ] `curl -I https://jcrenshaw.dev` returns HTTP 200 over a valid cert with no browser
      warning, and the body is served by the SSR droplet with live Ghost content, not the
      old GitLab Pages static site.
- [ ] Cloudflare SSL mode is Full (Strict) and the proxied apex returns no 525/526
      origin-TLS errors.
- [ ] Publishing a post in Ghost makes it appear on the live apex `/writing` and
      `/posts/<slug>` with no manual build or deploy step.
- [ ] `curl -sI https://www.jcrenshaw.dev` returns a 301 to `https://jcrenshaw.dev`.
- [ ] A push to the deploy branch triggers a Coolify redeploy with no manual click, and
      the pushed change appears on the live apex.
- [ ] The Ghost publish webhook Target URL is the real Cloudflare purge endpoint (not
      webhook.site) and returns a success status on a publish event.

## Flagged assumptions

- Cache-purge auth shape - planner's call; if wrong: a direct Ghost webhook may not carry
  the bearer token + JSON body Cloudflare's API needs, forcing a small Worker intermediary.
- Coolify 4.1.2 + Cloudflare TLS interaction (external, needs a live check): whether
  Coolify's ACME HTTP-01 challenge completes with the apex grey-cloud, and confirming Full
  (Strict) over Flexible to avoid a redirect loop against Coolify's forced HTTP->HTTPS.
