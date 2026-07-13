import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './posts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    type: z.enum(['post', 'page']).default('post'),
    status: z.string().optional(),
    visibility: z.string().optional(),
    featured: z.boolean().optional(),
    feature_image: z.string().nullable().optional(),
    excerpt: z.string().nullable().optional(),
    canonical_url: z.string().nullable().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    published_at: z.coerce.date(),
    authors: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    meta_title: z.string().nullable().optional(),
    meta_description: z.string().nullable().optional(),
  }),
});

export const collections = { posts };
