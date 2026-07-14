// Seed a fresh Ghost instance from the local markdown corpus in ./posts.
//
// Standalone ES module, peer to og/render-og.mjs, run outside the Astro build.
// Idempotent: each entry is looked up by slug and updated in place, else created,
// so re-running never duplicates. Bodies are already Ghost-export HTML and are
// sent with { source: 'html' } so Ghost converts them to its lexical format.
//
//   node --env-file=.env scripts/seed-ghost.mjs            # seed live Ghost
//   node scripts/seed-ghost.mjs --dry-run                  # parse+map only, no network
//
// Env (live run): GHOST_ADMIN_API_URL, GHOST_ADMIN_API_KEY  (Admin-API only,
// a Custom Integration key from Ghost admin > Settings > Integrations).

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';
import GhostAdminAPI from '@tryghost/admin-api';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = join(ROOT, 'posts');

// --- helpers ---------------------------------------------------------------

// Every `__GHOST_URL__` in body HTML is an internal reference; stripping the
// marker (which is always followed by `/`) leaves a root-relative link, e.g.
// `__GHOST_URL__/still-skidding-broadside/` -> `/still-skidding-broadside/`.
const rewriteBody = (html) => html.replaceAll('__GHOST_URL__', '');

const toTags = (tags) => (Array.isArray(tags) ? tags.map((name) => ({ name })) : undefined);

const asDate = (v) => (v instanceof Date ? v.toISOString() : v ?? undefined);

// Parse one markdown file into a normalized entry.
function parseEntry(file) {
  const raw = readFileSync(join(POSTS_DIR, file), 'utf8');
  const { data, content } = matter(raw);
  const type = data.type || 'post';
  const html = rewriteBody(content).trim();
  if (html.includes('__GHOST_URL__')) {
    throw new Error(`${file}: __GHOST_URL__ survived body rewrite`);
  }
  return {
    file,
    type,
    slug: data.slug,
    // Fields common to Ghost posts and pages. `authors` is intentionally omitted
    // so Ghost defaults authorship to the integration owner (single-author site);
    // the frontmatter's display-name strings can't be resolved by the Admin API.
    payload: {
      title: data.title,
      slug: data.slug,
      status: data.status || 'published',
      visibility: data.visibility || 'public',
      featured: data.featured ?? false,
      custom_excerpt: data.excerpt ?? undefined,
      created_at: asDate(data.created_at),
      published_at: asDate(data.published_at),
      meta_title: data.meta_title ?? undefined,
      meta_description: data.meta_description ?? undefined,
      tags: toTags(data.tags),
      html,
    },
    // Raw feature image marker (only death-by-yes carries one); resolved live.
    rawFeatureImage: data.feature_image || null,
  };
}

// Re-source the one dead feature image: the Unsplash original encoded in the
// filename (…-<photoId>-unsplash.jpg) is re-fetched and uploaded to Ghost.
// Idempotent: if the live post already has a Ghost-hosted image, reuse it.
async function resolveFeatureImage(api, entry, existing) {
  const marker = entry.rawFeatureImage;
  if (!marker) return undefined;
  if (!marker.includes('__GHOST_URL__')) return marker; // already a real URL
  if (existing?.feature_image?.includes('/content/images/')) {
    return existing.feature_image; // already re-sourced on a prior run
  }
  const m = marker.match(/-([A-Za-z0-9_-]{11})-unsplash/);
  if (!m) throw new Error(`${entry.file}: cannot extract Unsplash id from ${marker}`);
  const photoId = m[1];
  const dlUrl = `https://unsplash.com/photos/${photoId}/download?force=true`;
  const res = await fetch(dlUrl, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${entry.file}: Unsplash fetch ${photoId} -> HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const tmp = join(tmpdir(), `${photoId}-unsplash.jpg`);
  writeFileSync(tmp, bytes);
  const uploaded = await api.images.upload({ file: tmp, ref: `${photoId}-unsplash.jpg` });
  console.log(`  re-sourced feature image ${photoId} -> ${uploaded.url}`);
  return uploaded.url;
}

// Upsert one entry via the posts or pages resource.
async function upsert(api, entry) {
  const resource = entry.type === 'page' ? api.pages : api.posts;
  const [existing] = await resource.browse({ filter: `slug:${entry.slug}`, limit: 1 });
  const feature_image = await resolveFeatureImage(api, entry, existing);
  const body = { ...entry.payload, ...(feature_image ? { feature_image } : {}) };
  if (existing) {
    // Ghost requires the server's current updated_at for collision detection.
    await resource.edit({ ...body, id: existing.id, updated_at: existing.updated_at }, { source: 'html' });
    return 'updated';
  }
  await resource.add(body, { source: 'html' });
  return 'created';
}

// --- main ------------------------------------------------------------------

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md')).sort();
const entries = files.map(parseEntry);
const posts = entries.filter((e) => e.type === 'post');
const pages = entries.filter((e) => e.type === 'page');

if (DRY_RUN) {
  for (const e of entries) {
    const fi = e.rawFeatureImage
      ? (e.rawFeatureImage.includes('__GHOST_URL__') ? '[re-source Unsplash]' : e.rawFeatureImage)
      : '-';
    console.log(`${e.type.padEnd(4)} ${String(e.payload.status).padEnd(9)} ${e.payload.published_at}  ${e.slug}  img=${fi}`);
  }
  console.log(`\n${posts.length} post(s), ${pages.length} page(s); 0 __GHOST_URL__ markers survived body rewrite.`);
  if (posts.length !== 18 || pages.length !== 1) {
    console.error(`EXPECTED 18 posts + 1 page, got ${posts.length} + ${pages.length}`);
    process.exit(1);
  }
  process.exit(0);
}

const url = process.env.GHOST_ADMIN_API_URL;
const key = process.env.GHOST_ADMIN_API_KEY;
if (!url || !key) {
  console.error('Missing GHOST_ADMIN_API_URL / GHOST_ADMIN_API_KEY (use --env-file=.env).');
  process.exit(1);
}
const api = new GhostAdminAPI({ url, key, version: 'v5.0' });

let created = 0, updated = 0;
for (const entry of entries) {
  const result = await upsert(api, entry);
  result === 'created' ? created++ : updated++;
  console.log(`${result}: ${entry.type} ${entry.slug}`);
}
console.log(`\nSeed complete: ${created} created, ${updated} updated (${posts.length} posts + ${pages.length} page).`);
