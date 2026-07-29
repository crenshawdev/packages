// Fetches the flagship project's latest release from the Forgejo API.
// Public repo, no auth. Falls back to a curated value so a render never breaks
// (e.g. offline or API hiccup). Under SSR this process is long-lived, so the
// result is cached with a TTL and re-fetched once it expires, rather than
// memoized forever, keeping the shown version fresh without a redeploy.

const TAGS_URL =
  'https://git.jcrenshaw.dev/api/v1/repos/crenshawdev/weathervane/tags?limit=1';

// Re-fetch at most once per TTL window under the long-lived SSR server.
const TTL_MS = 600000; // 10 minutes

export interface LatestCode {
  version: string;
  released: string | null; // ISO date of the release commit
  live: boolean; // true when fetched, false when the fallback was used
}

const FALLBACK: LatestCode = { version: 'v0.9.1', released: null, live: false };

const HEADERS = {
  'User-Agent': 'jcrenshaw.dev build',
  Accept: 'application/json',
};

let cache: Promise<LatestCode> | null = null;
let cachedAt = 0;

async function fetchLatest(): Promise<LatestCode> {
  try {
    const res = await fetch(TAGS_URL, {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Forgejo tags ${res.status}`);
    const tags = await res.json();
    const tag = Array.isArray(tags) ? tags[0] : null;
    if (!tag?.name) throw new Error('no tags returned');
    const name = String(tag.name);

    // Forgejo tag objects carry the tagged commit's date inline.
    const released: string | null = tag.commit?.created ?? null;

    return {
      version: name.startsWith('v') ? name : `v${name}`,
      released,
      live: true,
    };
  } catch (err) {
    console.warn('[latestCode] using fallback:', (err as Error).message);
    return FALLBACK;
  }
}

export function getLatestCode(): Promise<LatestCode> {
  if (!cache || Date.now() - cachedAt > TTL_MS) {
    cachedAt = Date.now();
    cache = fetchLatest();
  }
  return cache;
}
