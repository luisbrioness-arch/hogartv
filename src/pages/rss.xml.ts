import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles');

  return rss({
    title: 'HogarTV.cl - Guías de TV, Streaming y TVD en Chile',
    description: 'Guías expertas de compra de Smart TVs, tutoriales de televisión digital abierta (TVD) y comparativas de streaming en Chile.',
    site: context.site ? context.site.toString() : 'https://hogartv.cl',
    items: articles.map((article) => {
      const slug = article.id.replace(/\.(md|mdx)$/, '');
      return {
        title: article.data.title,
        pubDate: new Date(article.data.publishDate),
        description: article.data.description,
        categories: [article.data.categoryName],
        link: `/${article.data.category}/${slug}/`,
      };
    }),
    customData: `<language>es-CL</language>`,
  });
}
