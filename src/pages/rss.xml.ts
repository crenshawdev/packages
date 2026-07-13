import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/content';

const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '';

export async function GET(context: APIContext) {
  // Same published-post filter as src/lib/content.ts — feed and site must never disagree.
  const posts = await getPublishedPosts();

  return rss({
    title: 'John Crenshaw — Writing',
    description: 'Essays on Linux, Rust, privacy, and leaving rented software behind.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.title,
      pubDate: p.publishedAt,
      description: p.excerpt ?? p.metaDescription ?? '',
      link: `${base}/posts/${p.slug}`,
    })),
  });
}
