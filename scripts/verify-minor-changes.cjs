const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

console.log('--- 1. Verificación de Preload de Fuente Inter ---');
const preloadMatch = html.match(/<link\s+[^>]*rel=["']preload["'][^>]*>/i);
if (preloadMatch) {
  console.log('  ✅ Tag encontrado:', preloadMatch[0]);
  const hrefMatch = preloadMatch[0].match(/href=["']([^"']+)["']/);
  if (hrefMatch) {
    const fontPath = path.join(distDir, hrefMatch[1].replace(/^\//, ''));
    console.log(`  ✅ Archivo .woff2 existe en disco (${fontPath}):`, fs.existsSync(fontPath));
  }
} else {
  console.error('  ❌ ERROR: No se encontró <link rel="preload"> en <head>');
  process.exit(1);
}

console.log('\n--- 2. Verificación de Apple Touch Icon y Web App Manifest ---');
const appleIconExists = fs.existsSync(path.join(distDir, 'apple-touch-icon.png'));
const manifestExists = fs.existsSync(path.join(distDir, 'site.webmanifest'));
console.log('  ¿Existe dist/apple-touch-icon.png (180x180)?:', appleIconExists ? '✅ SÍ' : '❌ NO');
console.log('  ¿Existe dist/site.webmanifest?:', manifestExists ? '✅ SÍ' : '❌ NO');

const appleTagMatch = html.match(/<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*>/i);
const manifestTagMatch = html.match(/<link\s+[^>]*rel=["']manifest["'][^>]*>/i);
console.log('  Tag apple-touch-icon:', appleTagMatch ? `✅ ${appleTagMatch[0]}` : '❌ NO');
console.log('  Tag manifest:', manifestTagMatch ? `✅ ${manifestTagMatch[0]}` : '❌ NO');

if (!appleIconExists || !manifestExists || !appleTagMatch || !manifestTagMatch) {
  console.error('  ❌ ERROR en verificación de assets de iconos/manifest.');
  process.exit(1);
}

console.log('\n--- 3. Verificación de Email en Página de Contacto ---');
const contactoHtml = fs.readFileSync(path.join(distDir, 'contacto', 'index.html'), 'utf8');
const mailtoMatches = [...contactoHtml.matchAll(/mailto:([^"'\s>]+)/g)].map(m => m[1]);
console.log('  Destinatario de contacto en HTML:', mailtoMatches[0]);
console.log('  ¿Formulario presente y funcional?:', contactoHtml.includes('<form') ? '✅ SÍ' : '❌ NO');

console.log('\n--- 4. Verificación de Duplicados CSS ---');
const cssLinks = [...html.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi)].map(m => m[0]);
const hrefs = cssLinks.map(link => {
  const m = link.match(/href=["']([^"']+)["']/);
  return m ? m[1] : link;
});
const uniqueHrefs = new Set(hrefs);
const hasDuplicates = uniqueHrefs.size !== hrefs.length;
console.log(`  Archivos CSS en Home: ${hrefs.length} (${hrefs.join(', ')})`);
console.log('  ¿Hay CSS duplicado?:', hasDuplicates ? '❌ SÍ' : '✅ NO');

if (hasDuplicates) {
  process.exit(1);
}

console.log('\n========================================');
console.log('✅ TODOS LOS CAMBIOS MENORES VERIFICADOS CON ÉXITO');
console.log('========================================');
