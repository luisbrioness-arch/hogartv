const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');

if (!fs.existsSync(distDir)) {
  console.error('❌ ERROR: Directorio dist/ no existe. Ejecuta primero npm run build.');
  process.exit(1);
}

// 1. Validar existencia de estructura de carpetas en src/assets/
const requiredAssetDirs = [
  path.join(projectRoot, 'src', 'assets', 'autores'),
  path.join(projectRoot, 'src', 'assets', 'smart-tv', 'mejores-smart-tv-calidad-precio-chile'),
  path.join(projectRoot, 'src', 'assets', 'tv-abierta', 'como-sintonizar-canales-hd-tvd-chile'),
  path.join(projectRoot, 'src', 'assets', 'accesorios', 'roku-vs-chromecast-chile-cual-conviene'),
];

console.log('--- 1. Validación de Estructura de Directorios en src/assets/ ---');
let dirsOk = true;
requiredAssetDirs.forEach(dir => {
  const rel = path.relative(projectRoot, dir);
  if (fs.existsSync(dir)) {
    console.log(`  ✅ Directorio encontrado: ${rel}`);
  } else {
    console.error(`  ❌ FALTA Directorio: ${rel}`);
    dirsOk = false;
  }
});

if (!dirsOk) {
  process.exit(1);
}

// 2. Escaneo de etiquetas <img> en dist/ para validar alt, dimensiones y loading
console.log('\n--- 2. Validación de Accesibilidad y Performance de Imágenes en dist/ ---');

let totalHtmlFiles = 0;
let totalImages = 0;
let violations = [];

function scanHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanHtmlFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      totalHtmlFiles++;
      const html = fs.readFileSync(fullPath, 'utf8');
      const relFile = path.relative(projectRoot, fullPath);

      // Regex para encontrar etiquetas <img ...>
      const imgMatches = html.match(/<img\b[^>]*>/gi) || [];
      imgMatches.forEach(imgTag => {
        totalImages++;
        
        // Verificar alt
        const altMatch = imgTag.match(/\balt=["']([^"']*)["']/i);
        const hasAlt = Boolean(altMatch);
        const altValue = altMatch ? altMatch[1].trim() : '';
        const isAriaHidden = /aria-hidden=["']true["']/i.test(imgTag);

        // Si falta alt o está vacío y no es aria-hidden
        if (!hasAlt || (!altValue && !isAriaHidden)) {
          violations.push({
            file: relFile,
            tag: imgTag,
            issue: 'Falta atributo alt o está vacío sin aria-hidden'
          });
        }

        // Verificar dimensiones explicitas width y height
        const hasWidth = /\bwidth=["']?\d+["']?/i.test(imgTag);
        const hasHeight = /\bheight=["']?\d+["']?/i.test(imgTag);
        if (!hasWidth || !hasHeight) {
          violations.push({
            file: relFile,
            tag: imgTag,
            issue: 'Faltan dimensiones explícitas (width / height) requeridas para evitar CLS'
          });
        }

        // Verificar lazy/eager loading
        const hasLoading = /\bloading=["'](lazy|eager)["']/i.test(imgTag);
        if (!hasLoading) {
          violations.push({
            file: relFile,
            tag: imgTag,
            issue: 'Falta atributo loading="lazy" o loading="eager"'
          });
        }
      });
    }
  }
}

scanHtmlFiles(distDir);

console.log(`Archivos HTML analizados: ${totalHtmlFiles}`);
console.log(`Etiquetas <img> analizadas en producción: ${totalImages}`);

if (violations.length > 0) {
  console.error(`\n❌ ERROR: Se detectaron ${violations.length} infracciones en imágenes:\n`);
  violations.forEach(v => {
    console.error(`  - Archivo: ${v.file}`);
    console.error(`    Problema: ${v.issue}`);
    console.error(`    Etiqueta: ${v.tag}\n`);
  });
  process.exit(1);
} else {
  console.log('\n✅ ÉXITO: Todas las imágenes cumplen estrictamente con alt no vacío, width/height y loading.');
  process.exit(0);
}
