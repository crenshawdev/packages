// Fetches the flagship project's latest release at build time from the GitHub API.
// Public repo, no auth. Falls back to a curated value so the build never breaks
// (e.g. offline or API hiccup). Memoized: one request per build even if both the
// entry and the code room import it.

const TAGS_URL = 'https://api.github.com/repos/crenshawdev/tempest/tags?per_page=1';

export interface LatestCode {
  version: string;
  released: string | null; // ISO date of the release commit
  live: boolean; // true when fetched, false when the fallback was used
}

const FALLBACK: LatestCode = { version: 'v2.11.0', released: null, live: false };

const HEADERS = {
  'User-Agent': 'jcrenshaw.dev build',
  Accept: 'application/vnd.github+json',
};

let cache: Promise<LatestCode> | null = null;

async function fetchLatest(): Promise<LatestCode> {
  try {
    const res = await fetch(TAGS_URL, {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`GitHub tags ${res.status}`);
    const tags = await res.json();
    const tag = Array.isArray(tags) ? tags[0] : null;
    if (!tag?.name) throw new Error('no tags returned');
    const name = String(tag.name);

    // GitHub tag objects carry no date; fetch the tagged commit for its committer date.
    let released: string | null = null;
    const commitUrl = tag.commit?.url;
    if (commitUrl) {
      const commitRes = await fetch(commitUrl, {
        headers: HEADERS,
        signal: AbortSignal.timeout(8000),
      });
      if (!commitRes.ok) throw new Error(`GitHub commit ${commitRes.status}`);
      const commit = await commitRes.json();
      released = commit.commit?.committer?.date ?? null;
    }

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
  if (!cache) cache = fetchLatest();
  return cache;
}
