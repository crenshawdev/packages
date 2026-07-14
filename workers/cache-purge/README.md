# cache-purge Worker

Authenticated intermediary that lets a Ghost publish webhook purge the Cloudflare
cache. Ghost webhooks can't send an `Authorization` header; this Worker adds one.

Flow: Ghost `post.published` (+ edited/unpublished) -> POST this Worker with a
shared secret in the URL -> Worker calls Cloudflare `purge_cache`
(`purge_everything`) with a scoped Bearer token.

## Deploy

All commands run from `workers/cache-purge/`.

1. **Create a scoped Cloudflare API token.** Cloudflare dashboard -> My Profile ->
   API Tokens -> Create Token -> Custom token. Permissions: **Zone -> Cache Purge
   -> Purge**. Zone Resources: **Include -> Specific zone -> jcrenshaw.dev**.
   Create, then copy the token (shown once).

2. **Get the zone id.** Cloudflare -> the `jcrenshaw.dev` zone -> Overview -> the
   right sidebar shows **Zone ID**. Copy it into `wrangler.toml` (`CF_ZONE_ID`).

3. **Authenticate wrangler** (one time): `npx wrangler login` (opens a browser).

4. **Set the two secrets** (you'll be prompted to paste each value):
   - `npx wrangler secret put PURGE_SECRET` — paste a long random string you
     generate (e.g. `openssl rand -hex 24`). Save this value; it goes in the Ghost
     Target URL below.
   - `npx wrangler secret put CF_API_TOKEN` — paste the token from step 1.

5. **Deploy:** `npx wrangler deploy`. Note the Worker URL it prints
   (e.g. `https://cache-purge.<subdomain>.workers.dev`).

6. **Point Ghost at it.** Ghost Admin -> Settings -> Integrations -> the existing
   **Staging cache purge** integration. For **each** of its three webhooks
   (`post.published`, `post.published.edited`, `post.unpublished`), set the
   **Target URL** to:

   `<worker-url>/purge/<PURGE_SECRET>`

   (the deployed Worker URL, then `/purge/`, then the PURGE_SECRET from step 4).

## Verify

- Unauthenticated request is rejected (no purge fires):
  `curl -s -o /dev/null -w "%{http_code}\n" -X POST <worker-url>/purge/wrong-secret`
  -> `401`.
- Correct secret purges: publish a test post in Ghost, then confirm via
  `npx wrangler tail` (shows a `{"success":true}` Cloudflare response) or the Ghost
  webhook delivery (2xx). Then `curl -sI https://jcrenshaw.dev/tempest-og.png`
  shows `cf-cache-status: MISS` right after. Delete the test post afterward.

Apex HTML is not edge-cached (SSR, `cf-cache-status: DYNAMIC`), so `purge_everything`
only refreshes static/OG assets — it does not gate content going live.
