const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(process.cwd(), 'dist', 'sitemap-0.xml');
if (!fs.existsSync(sitemapPath)) {
  console.error('Error: dist/sitemap-0.xml does not exist. Run npm run build first.');
  process.exit(1);
}

const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
const sitemapUrls = [...sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

console.log(`Auditing ${sitemapUrls.length} URLs from sitemap-0.xml against dist HTML files...\n`);

let allMatch = true;
const results = [];

for (const url of sitemapUrls) {
  const parsed = new URL(url);
  let relativePath = parsed.pathname;
  if (relativePath.endsWith('/')) {
    relativePath += 'index.html';
  } else {
    relativePath += '/index.html';
  }
  
  // Remove leading slash for local path resolution
  const htmlFile = path.join(process.cwd(), 'dist', relativePath.replace(/^\//, ''));
  
  if (!fs.existsSync(htmlFile)) {
    results.push({
      sitemapUrl: url,
      canonicalUrl: 'ARCHIVO NO ENCONTRADO (' + relativePath + ')',
      matches: false
    });
    allMatch = false;
    continue;
  }
  
  const html = fs.readFileSync(htmlFile, 'utf8');
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1] : 'CANONICAL NO ENCONTRADO';
  
  const matches = (url === canonicalUrl);
  if (!matches) {
    allMatch = false;
  }
  
  results.push({
    sitemapUrl: url,
    canonicalUrl,
    matches
  });
}

// Imprimir tabla en consola estilo Markdown
console.log('| # | URL en sitemap | URL en canonical del HTML | ¿Coinciden carácter por carácter? |');
console.log('|---|----------------|---------------------------|:--------------------------------:|');
results.forEach((r, idx) => {
  console.log(`| ${idx + 1} | \`${r.sitemapUrl}\` | \`${r.canonicalUrl}\` | ${r.matches ? '✅ Sí' : '❌ No'} |`);
});

console.log('\n----------------------------------------');
if (allMatch && results.length === 14) {
  console.log(`✅ ÉXITO: Las ${results.length} URLs coinciden exactamente carácter por carácter.`);
  process.exit(0);
} else {
  console.error(`❌ ERROR: Hay discrepancias en las URLs o no son 14 URLs.`);
  process.exit(1);
}
