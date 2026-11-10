import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://hogartv.cl',
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    mdx(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      filter: (page) => {
        const excluded = [
          'https://hogartv.cl/crm/',
          'https://hogartv.cl/virales/',
          'https://hogartv.cl/ofertas-tv-chile/',
          'https://hogartv.cl/gadgets-hogar/',
          'https://hogartv.cl/recomendados/',
          'https://hogartv.cl/accesorios/lagarto-verde-auto-movimiento-viral-tiktok-chile/',
        ];
        return !excluded.some((url) => page === url || page.startsWith(url));
      },
      serialize(item) {
        item.lastmod = '2026-04-15T12:00:00.000Z';
        return item;
      },
    }),
  ],
});
