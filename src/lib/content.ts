import { getCollection, getEntry, render } from 'astro:content';

export interface Post {
  id: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string | null;
  metaDescription: string | null;
  publishedAt: Date;
  tags: string[];
}

type PostEntry = Awaited<ReturnType<typeof getCollection<'posts'>>>[number];

function isPublished(entry: PostEntry): boolean {
  return (
    entry.data.type === 'post' &&
    entry.data.status !== 'draft' &&
    entry.data.visibility !== 'private'
  );
}

function toPost(entry: PostEntry): Post {
  return {
    id: entry.id,
    slug: entry.data.slug ?? entry.id,
    title: entry.data.title,
    body: entry.body ?? '',
    excerpt: entry.data.excerpt ?? null,
    metaDescription: entry.data.meta_description ?? null,
    publishedAt: entry.data.published_at,
    tags: entry.data.tags ?? [],
  };
}

export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts');
  return all
    .filter(isPublished)
    .sort((a, b) => b.data.published_at.valueOf() - a.data.published_at.valueOf())
    .map(toPost);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getPublishedPosts();
  return posts.find((p) => p.slug === slug);
}

export async function renderBody(id: string) {
  const entry = await getEntry('posts', id);
  if (!entry) {
    throw new Error(`No post entry found for id "${id}"`);
  }
  return render(entry);
}
