const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const distDir = path.join(__dirname, '..', 'dist');

function getHtmlFiles(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getHtmlFiles(full));
    } else if (item.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

const htmlFiles = getHtmlFiles(distDir);
console.log(`Total HTML files found: ${htmlFiles.length}\n`);

const cssPerHtml = {};
for (const file of htmlFiles) {
  const relPath = path.relative(distDir, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const matches = [...html.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi)];
  const cssFiles = matches.map(m => {
    const href = m[0].match(/href=["']([^"']+)["']/);
    return href ? href[1] : m[0];
  });
  cssPerHtml[relPath] = cssFiles;
}

console.log('CSS files included per page:');
for (const [page, cssList] of Object.entries(cssPerHtml)) {
  console.log(`  ${page}:`);
  cssList.forEach(c => console.log(`    - ${c}`));
}

console.log('\n--- CSS File Sizes ---');
const astroDir = path.join(distDir, '_astro');
const astroFiles = fs.readdirSync(astroDir).filter(f => f.endsWith('.css'));

for (const f of astroFiles) {
  const full = path.join(astroDir, f);
  const raw = fs.readFileSync(full);
  const gzip = zlib.gzipSync(raw);
  const brotli = zlib.brotliCompressSync(raw);
  console.log(`\nFile: ${f}`);
  console.log(`  Raw:     ${raw.length.toLocaleString()} bytes (${(raw.length / 1024).toFixed(2)} KB)`);
  console.log(`  Gzip:    ${gzip.length.toLocaleString()} bytes (${(gzip.length / 1024).toFixed(2)} KB)`);
  console.log(`  Brotli:  ${brotli.length.toLocaleString()} bytes (${(brotli.length / 1024).toFixed(2)} KB)`);
}
