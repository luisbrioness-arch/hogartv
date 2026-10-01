import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['smart-tv', 'streaming', 'tv-abierta', 'accesorios']),
    categoryName: z.string(),
    publishDate: z.string(),
    dateModified: z.string().optional(),
    readTime: z.string().optional().default('5 min de lectura'),
    featured: z.boolean().optional().default(false),
    heroImage: z.string().optional(),
    ogImage: z.string().optional(),
    author: z.string().optional().default('luis-briones'),
  }),
});

export const collections = { articles };
