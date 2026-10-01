const fs = require('fs');
const path = require('path');

const distDir = path.join(process.cwd(), 'dist');
let hasDuplicates = false;

function checkCss(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      checkCss(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const html = fs.readFileSync(fullPath, 'utf8');
      const cssLinks = [...html.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi)].map(m => m[0]);
      const hrefs = cssLinks.map(link => {
        const hrefMatch = link.match(/href=["']([^"']+)["']/);
        return hrefMatch ? hrefMatch[1] : link;
      });
      
      const uniqueHrefs = new Set(hrefs);
      const isDuplicate = uniqueHrefs.size !== hrefs.length;
      if (isDuplicate) {
        hasDuplicates = true;
        console.error(`❌ DUPLICADO en ${path.relative(distDir, fullPath)}:`, hrefs);
      } else {
        console.log(`✅ ${path.relative(distDir, fullPath)}: ${hrefs.length} archivo(s) CSS (${hrefs.join(', ')})`);
      }
    }
  }
}

console.log('Auditing CSS link tags across dist HTML files...\n');
checkCss(distDir);

if (hasDuplicates) {
  console.error('\n❌ ERROR: Se detectaron hojas de estilo duplicadas.');
  process.exit(1);
} else {
  console.log('\n✅ ÉXITO: Cero CSS duplicado. Code-splitting y empaquetado limpios.');
  process.exit(0);
}
