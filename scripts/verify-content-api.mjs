// Standalone check that the Ghost Content API is reachable from the front end's
// environment and returns the seeded posts. Throwaway verification for Phase 2;
// the real markdown->Ghost data-source cutover is Phase 3.
//
//   node --env-file=.env scripts/verify-content-api.mjs
//
// Env: GHOST_URL, GHOST_CONTENT_API_KEY (read-only Content API key).

const url = process.env.GHOST_URL;
const key = process.env.GHOST_CONTENT_API_KEY;
if (!url || !key) {
  console.error('Missing GHOST_URL / GHOST_CONTENT_API_KEY (use --env-file=.env).');
  process.exit(1);
}

const endpoint = `${url}/ghost/api/content/posts/?key=${key}&limit=all&fields=slug,title`;
const res = await fetch(endpoint);
if (!res.ok) {
  console.error(`Content API ${url} -> HTTP ${res.status}`);
  process.exit(1);
}
const { posts } = await res.json();
console.log(`Content API OK: ${posts.length} published post(s) returned from ${url}`);
