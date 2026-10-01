const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const dirsToScan = [
  path.join(projectRoot, 'src', 'content'),
  path.join(projectRoot, 'src', 'pages'),
  path.join(projectRoot, 'src', 'components'),
  path.join(projectRoot, 'src', 'layouts'),
];

// Regex para detectar dominios crudos de Mercado Libre en URLs
// Ej: https://listado.mercadolibre.cl, https://articulo.mercadolibre.cl, etc.
const rawMeliRegex = /https?:\/\/[a-zA-Z0-9.-]*mercadolibre\.cl[^\s"'>)\]]*/gi;

let violations = [];
let filesScanned = 0;

function scanFile(filePath) {
  filesScanned++;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Si la línea contiene la regex de mercadolibre
    const matches = line.match(rawMeliRegex);
    if (matches) {
      matches.forEach(m => {
        violations.push({
          file: path.relative(projectRoot, filePath),
          line: index + 1,
          matchedUrl: m,
          lineContent: line.trim()
        });
      });
    }
  });
}

function scanDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      // Escanear archivos de contenido y código
      if (/\.(md|mdx|astro|ts|js|jsx|tsx|html)$/i.test(entry.name)) {
        scanFile(fullPath);
      }
    }
  }
}

// 1. Escaneo de archivos fuente en src/ (excluyendo src/data/afiliados.json explícitamente)
dirsToScan.forEach(scanDir);

// 2. Escaneo de HTML compilado en dist/ (si existe) para validar que en runtime tampoco se emitan
const distDir = path.join(projectRoot, 'dist');
let distFilesScanned = 0;
if (fs.existsSync(distDir)) {
  function scanDist(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDist(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        distFilesScanned++;
        const content = fs.readFileSync(fullPath, 'utf8');
        // Buscar enlaces href crudos a mercadolibre.cl
        const hrefMatches = content.match(/href=["'](https?:\/\/[a-zA-Z0-9.-]*mercadolibre\.cl[^"']*)["']/gi);
        if (hrefMatches) {
          hrefMatches.forEach(m => {
            violations.push({
              file: path.relative(projectRoot, fullPath),
              line: 1,
              matchedUrl: m,
              lineContent: 'Enlace crudo detectado en HTML compilado'
            });
          });
        }
      }
    }
  }
  scanDist(distDir);
}

console.log(`[check-affiliates] Escaneo completado:`);
console.log(`  - Archivos fuente en src/ analizados: ${filesScanned}`);
if (distFilesScanned > 0) {
  console.log(`  - Páginas HTML en dist/ analizadas: ${distFilesScanned}`);
}

if (violations.length > 0) {
  console.error(`\n❌ ERROR: Se encontraron ${violations.length} URL(s) crudas a mercadolibre.cl fuera de src/data/afiliados.json:\n`);
  violations.forEach(v => {
    console.error(`  - ${v.file}:${v.line}`);
    console.error(`    URL: ${v.matchedUrl}`);
    console.error(`    Línea: ${v.lineContent}\n`);
  });
  console.error('👉 REGLA: Todas las URLs de afiliados deben ir por meli.la o centralizarse a través de src/data/afiliados.json y los componentes <AffiliateLink> / <ProductCard>.');
  process.exit(1);
} else {
  console.log(`\n✅ ÉXITO: Cero URLs crudas a mercadolibre.cl encontradas en el contenido y páginas.`);
  process.exit(0);
}
