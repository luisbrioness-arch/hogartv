import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

/**
 * Rehype plugin ligero (sin dependencias externas) que envuelve todas las
 * tablas Markdown en un contenedor semántico accesible `.table-wrapper` y
 * agrega `data-label` a cada celda <td> para que en pantallas móviles (< 540px)
 * las tablas de 3+ columnas se apilen como fichas sin desborde horizontal.
 */
function rehypeResponsiveTables() {
  const extractText = (node) => {
    if (!node) return '';
    if (node.type === 'text') return node.value || '';
    if (Array.isArray(node.children)) {
      return node.children.map(extractText).join('').trim();
    }
    return '';
  };

  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child && child.type === 'element' && child.tagName === 'table') {
        const headers = [];
        const thead = (child.children || []).find(
          (c) => c.type === 'element' && c.tagName === 'thead'
        );
        if (thead && Array.isArray(thead.children)) {
          const headerRow = thead.children.find(
            (c) => c.type === 'element' && c.tagName === 'tr'
          );
          if (headerRow && Array.isArray(headerRow.children)) {
            for (const cell of headerRow.children) {
              if (cell.type === 'element' && (cell.tagName === 'th' || cell.tagName === 'td')) {
                headers.push(extractText(cell));
              }
            }
          }
        }

        const tbody = (child.children || []).find(
          (c) => c.type === 'element' && c.tagName === 'tbody'
        );
        if (tbody && Array.isArray(tbody.children) && headers.length > 0) {
          for (const row of tbody.children) {
            if (row.type === 'element' && row.tagName === 'tr' && Array.isArray(row.children)) {
              let colIdx = 0;
              for (const cell of row.children) {
                if (cell.type === 'element' && (cell.tagName === 'td' || cell.tagName === 'th')) {
                  cell.properties = cell.properties || {};
                  if (headers[colIdx]) {
                    cell.properties['data-label'] = headers[colIdx];
                  }
                  colIdx++;
                }
              }
            }
          }
        }

        child.properties = child.properties || {};
        child.properties['data-cols'] = String(headers.length || 2);

        node.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['table-wrapper'],
            tabIndex: 0,
            role: 'region',
            'aria-label': 'Tabla comparativa',
          },
          children: [child],
        };
      } else {
        visit(child);
      }
    }
  };

  return (tree) => {
    visit(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://hogartv.cl',
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  markdown: {
    rehypePlugins: [rehypeResponsiveTables],
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
