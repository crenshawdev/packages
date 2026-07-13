import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '';

export async function GET(context: APIContext) {
  // Same published-post filter as src/pages/index.astro:9 — feed and site must never disagree.
  const posts = (await getCollection('posts'))
    .filter((p) => p.data.type === 'post' && p.data.status !== 'draft' && p.data.visibility !== 'private')
    .sort((a, b) => b.data.published_at.valueOf() - a.data.published_at.valueOf());

  return rss({
    title: 'John Crenshaw — Writing',
    description: 'Essays on Linux, Rust, privacy, and leaving rented software behind.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.published_at,
      description: p.data.excerpt ?? p.data.meta_description ?? '',
      link: `${base}/posts/${p.data.slug ?? p.id}`,
    })),
  });
}
