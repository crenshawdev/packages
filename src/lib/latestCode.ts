// Fetches the flagship project's latest release at build time from the GitLab API.
// Public project, no auth. Falls back to a curated value so the build never breaks
// (e.g. offline or API hiccup). Memoized: one request per build even if both the
// entry and the code room import it.

const PROJECT = 'vintagetechie%2Fcosmic-ext-applet-tempest';
const TAGS_URL = `https://gitlab.com/api/v4/projects/${PROJECT}/repository/tags?per_page=1`;

export interface LatestCode {
  version: string;
  released: string | null; // ISO date of the release commit
  live: boolean; // true when fetched, false when the fallback was used
}

const FALLBACK: LatestCode = { version: 'v2.9.5', released: null, live: false };

let cache: Promise<LatestCode> | null = null;

async function fetchLatest(): Promise<LatestCode> {
  try {
    const res = await fetch(TAGS_URL, {
      headers: { 'User-Agent': 'jcrenshaw.dev build' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`GitLab tags ${res.status}`);
    const tags = await res.json();
    const tag = Array.isArray(tags) ? tags[0] : null;
    if (!tag?.name) throw new Error('no tags returned');
    const name = String(tag.name);
    return {
      version: name.startsWith('v') ? name : `v${name}`,
      released: tag.commit?.created_at ?? null,
      live: true,
    };
  } catch (err) {
    console.warn('[latestCode] using fallback:', (err as Error).message);
    return FALLBACK;
  }
}

export function getLatestCode(): Promise<LatestCode> {
  if (!cache) cache = fetchLatest();
  return cache;
}
