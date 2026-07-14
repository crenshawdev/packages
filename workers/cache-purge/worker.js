// Cache-purge intermediary: Ghost publish webhook -> Cloudflare cache purge.
//
// Ghost custom-integration webhooks send only a signed JSON payload and cannot
// set an `Authorization: Bearer` header, which Cloudflare's purge_cache API
// requires. This Worker sits in between: it authenticates the inbound request
// with a shared secret, then calls the purge API with a scoped Bearer token.
//
// The route is public and triggers a zone-wide purge, so every request MUST
// authenticate or it becomes a cache-busting DoS lever. Auth is mandatory here,
// never optional.
//
// Secrets (set with `wrangler secret put`):
//   PURGE_SECRET  - shared secret; embedded as the last path segment of the
//                   Ghost webhook Target URL, so only Ghost knows it.
//   CF_API_TOKEN  - Cloudflare API token scoped to Zone > Cache Purge ONLY.
// Vars (wrangler.toml [vars]):
//   CF_ZONE_ID    - the jcrenshaw.dev zone id (not a secret).

// Constant-time comparison so a wrong secret can't be recovered by timing.
function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Shared secret is the last non-empty path segment: /purge/<secret>
    const provided = new URL(request.url).pathname.split('/').filter(Boolean).pop() || '';
    if (!env.PURGE_SECRET || !timingSafeEqual(provided, env.PURGE_SECRET)) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) {
      return new Response('Worker misconfigured: missing CF_API_TOKEN or CF_ZONE_ID', { status: 500 });
    }

    const cf = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purge_everything: true }),
      },
    );

    // Pass the Cloudflare API result straight back so `wrangler tail` / the Ghost
    // delivery log shows the real success/failure.
    return new Response(await cf.text(), {
      status: cf.status,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
