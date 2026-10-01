const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let errors = [];
let passed = 0;

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
    console.log(`❌ FAIL: ${message}`);
  } else {
    passed++;
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('====================================================');
console.log('   VERIFICACIÓN BLOQUE D: CONTENIDO, PRECIOS Y SEO');
console.log('====================================================\n');

// ----------------------------------------------------
// D1: Páginas de Categoría con Contenido > 600 palabras
// ----------------------------------------------------
console.log('--- Verificando D1: Densidad de contenido en categorías (>600 palabras) ---');

function countWordsInHtml(html) {
  // Remover scripts, styles, svgs y tags HTML
  const clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = clean.split(/\s+/).filter(w => w.length > 1);
  return words.length;
}

const categories = ['smart-tv', 'streaming', 'tv-abierta', 'accesorios'];
for (const cat of categories) {
  const file = path.join('dist', cat, 'index.html');
  assert(fs.existsSync(file), `Existe archivo generado para categoría ${cat}`);
  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf8');
    const wordCount = countWordsInHtml(html);
    assert(
      wordCount >= 600,
      `Categoría /${cat}/ tiene ${wordCount} palabras (mínimo exigido: 600 palabras)`
    );
  }
}

// ----------------------------------------------------
// D2: Precios Centralizados y Verificación de Antigüedad
// ----------------------------------------------------
console.log('\n--- Verificando D2: Precios centralizados y monitoreo ---');
const preciosPath = path.join('src', 'data', 'precios.json');
assert(fs.existsSync(preciosPath), 'Existe src/data/precios.json');

if (fs.existsSync(preciosPath)) {
  const preciosData = JSON.parse(fs.readFileSync(preciosPath, 'utf8'));
  const keys = Object.keys(preciosData);
  assert(keys.length >= 6, `src/data/precios.json contiene ${keys.length} productos (mínimo 6)`);
  
  for (const [k, p] of Object.entries(preciosData)) {
    assert(
      p.precioCLP && p.precioFormateado && p.rango && p.fechaVerificacion,
      `Producto ${k} tiene campos completos (precioCLP, precioFormateado, rango, fechaVerificacion)`
    );
  }
}

// Comprobar que ProductCard en mdx y en index.astro no tengan price= hardcodeado
const mdxDir = path.join('src', 'content', 'articles');
const mdxFiles = fs.readdirSync(mdxDir).filter(f => f.endsWith('.mdx'));
for (const file of mdxFiles) {
  const content = fs.readFileSync(path.join(mdxDir, file), 'utf8');
  assert(
    !content.match(/<ProductCard[^>]*\bprice\s*=/i),
    `Artículo ${file} no tiene precios hardcodeados en <ProductCard>`
  );
  assert(
    content.includes('dateModified:'),
    `Artículo ${file} define dateModified en frontmatter`
  );
}

const indexContent = fs.readFileSync(path.join('src', 'pages', 'index.astro'), 'utf8');
assert(
  !indexContent.match(/<ProductCard[^>]*\bprice\s*=/i),
  'src/pages/index.astro no tiene precio hardcodeado en ProductCard'
);

// Comprobar que script check-precios.cjs ejecuta exitosamente
try {
  const checkOutput = execSync('node scripts/check-precios.cjs', { encoding: 'utf8' });
  assert(
    checkOutput.includes('Resumen: 6 productos monitoreados'),
    'Script check-precios.cjs se ejecuta y reporta los 6 productos monitoreados'
  );
} catch (e) {
  assert(false, `check-precios.cjs falló: ${e.message}`);
}

// ----------------------------------------------------
// D3: Enlaces Contextuales Internos y Artículos Relacionados
// ----------------------------------------------------
console.log('\n--- Verificando D3: Enlaces internos contextuales y artículos relacionados ---');

// 1. Mejores Smart TV
const tvHtml = fs.readFileSync(path.join('dist', 'smart-tv', 'mejores-smart-tv-calidad-precio-chile', 'index.html'), 'utf8');
assert(
  tvHtml.includes('/tv-abierta/como-sintonizar-canales-hd-tvd-chile'),
  'Artículo Smart TV enlaza contextualmente a TV Abierta HD'
);
assert(
  tvHtml.includes('/accesorios/roku-vs-chromecast-chile-cual-conviene'),
  'Artículo Smart TV enlaza contextualmente a comparativa Roku vs Chromecast'
);
assert(
  tvHtml.includes('Artículos y Guías Relacionadas'),
  'Artículo Smart TV contiene bloque de Artículos Relacionados'
);
assert(
  tvHtml.includes('"dateModified":"2026-09-18"'),
  'Artículo Smart TV incluye dateModified en JSON-LD Article Schema'
);

// 2. TV Abierta
const tvdHtml = fs.readFileSync(path.join('dist', 'tv-abierta', 'como-sintonizar-canales-hd-tvd-chile', 'index.html'), 'utf8');
assert(
  tvdHtml.includes('/smart-tv/mejores-smart-tv-calidad-precio-chile'),
  'Artículo TVD enlaza contextualmente a mejores Smart TV'
);
assert(
  tvdHtml.includes('/accesorios/roku-vs-chromecast-chile-cual-conviene'),
  'Artículo TVD enlaza contextualmente a comparativa Roku vs Chromecast'
);
assert(
  tvdHtml.includes('Artículos y Guías Relacionadas'),
  'Artículo TVD contiene bloque de Artículos Relacionados'
);

// 3. Roku vs Chromecast
const rokuHtml = fs.readFileSync(path.join('dist', 'accesorios', 'roku-vs-chromecast-chile-cual-conviene', 'index.html'), 'utf8');
assert(
  rokuHtml.includes('/smart-tv/mejores-smart-tv-calidad-precio-chile'),
  'Artículo Roku vs Chromecast enlaza contextualmente a mejores Smart TV'
);
assert(
  rokuHtml.includes('/streaming/'),
  'Artículo Roku vs Chromecast enlaza contextualmente a categoría Streaming'
);
assert(
  rokuHtml.includes('/tv-abierta/como-sintonizar-canales-hd-tvd-chile'),
  'Artículo Roku vs Chromecast enlaza contextualmente a sintonización TVD'
);
assert(
  rokuHtml.includes('Artículos y Guías Relacionadas'),
  'Artículo Roku vs Chromecast contiene bloque de Artículos Relacionados'
);

// ----------------------------------------------------
// Auditoría de Jerarquía de Encabezados (0 skips)
// ----------------------------------------------------
console.log('\n--- Verificando Jerarquía de Encabezados en Dist ---');
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const htmlFiles = getHtmlFiles('dist');
let totalHeadingErrors = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const headingRegex = /<h([1-6])\b[^>]*>/gi;
  let match;
  let levels = [];
  while ((match = headingRegex.exec(html)) !== null) {
    levels.push(parseInt(match[1], 10));
  }

  const h1Count = levels.filter(l => l === 1).length;
  if (h1Count !== 1) {
    totalHeadingErrors++;
    errors.push(`Encabezados en ${file}: Esperado exactamente 1 <h1>, se encontraron ${h1Count}`);
  }

  for (let i = 0; i < levels.length - 1; i++) {
    const current = levels[i];
    const next = levels[i + 1];
    if (next > current + 1) {
      totalHeadingErrors++;
      errors.push(`Encabezados en ${file}: Salto detectado de <h${current}> a <h${next}>`);
    }
  }
}

assert(totalHeadingErrors === 0, `Jerarquía de encabezados perfecta en los ${htmlFiles.length} archivos HTML (0 saltos, exactamente 1 <h1> por página)`);

// ----------------------------------------------------
// Resumen Final
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`TOTAL PRUEBAS: ${passed + errors.length} | PASADAS: ${passed} | FALLIDAS: ${errors.length}`);
console.log('====================================================\n');

if (errors.length > 0) {
  console.error('ERRORES ENCONTRADOS:');
  errors.forEach(e => console.error(`- ${e}`));
  process.exit(1);
} else {
  console.log('🎉 TODAS LAS VERIFICACIONES DEL BLOQUE D PASARON EXITOSAMENTE.');
  process.exit(0);
}
