import { GHOST_URL, GHOST_CONTENT_API_KEY } from 'astro:env/server';
import {
  createComponent,
  renderTemplate,
  unescapeHTML,
} from 'astro/runtime/server/index.js';

export interface Post {
  id: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string | null;
  metaDescription: string | null;
  publishedAt: Date;
  tags: string[];
  featureImage: string | null;
}

interface GhostTag {
  name: string;
}

interface GhostPost {
  id: string;
  slug: string;
  title: string;
  html?: string | null;
  custom_excerpt?: string | null;
  meta_description?: string | null;
  published_at: string;
  feature_image?: string | null;
  tags?: GhostTag[];
}

interface GhostPage {
  html?: string | null;
}

function ghostConfig(): { url: string; key: string } {
  if (!GHOST_URL || !GHOST_CONTENT_API_KEY) {
    throw new Error(
      'Missing GHOST_URL / GHOST_CONTENT_API_KEY — set both in the environment before reading content.',
    );
  }
  return { url: GHOST_URL, key: GHOST_CONTENT_API_KEY };
}

async function fetchGhost<T>(resource: string, params: string): Promise<T> {
  const { url, key } = ghostConfig();
  const endpoint = `${url}/ghost/api/content/${resource}/?key=${key}&${params}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`Ghost Content API ${resource} -> HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

function toPost(p: GhostPost): Post {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    body: p.html ?? '',
    excerpt: p.custom_excerpt ?? null,
    metaDescription: p.meta_description ?? null,
    publishedAt: new Date(p.published_at),
    tags: (p.tags ?? []).map((t) => t.name),
    featureImage: p.feature_image ?? null,
  };
}

export async function getPublishedPosts(): Promise<Post[]> {
  const { posts } = await fetchGhost<{ posts: GhostPost[] }>(
    'posts',
    'limit=all&include=tags&formats=html&fields=id,slug,title,html,custom_excerpt,meta_description,published_at,feature_image',
  );
  return posts
    .map(toPost)
    .sort((a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf());
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getPublishedPosts();
  return posts.find((p) => p.slug === slug);
}

export async function renderBody(id: string) {
  let html: string | undefined;

  if (id === 'about') {
    const { pages } = await fetchGhost<{ pages: GhostPage[] }>(
      'pages',
      'filter=slug:about&formats=html&fields=html',
    );
    html = pages?.[0]?.html ?? undefined;
  } else {
    const posts = await getPublishedPosts();
    html = posts.find((p) => p.id === id)?.body;
  }

  if (html === undefined) {
    throw new Error(`No post entry found for id "${id}"`);
  }

  const safe = html;
  const Content = createComponent(() => renderTemplate`${unescapeHTML(safe)}`);
  return { Content };
}
