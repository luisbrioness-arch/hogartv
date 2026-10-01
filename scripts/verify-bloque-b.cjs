const fs = require('fs');
const path = require('path');

async function testBloqueB() {
  console.log('--- 1. Checking Static Routes in dist/ ---');
  const requiredRoutes = [
    'contacto/index.html',
    'privacidad/index.html',
    'terminos/index.html',
    'divulgacion-afiliados/index.html',
    'sobre-nosotros/index.html',
    'autor/luis-briones/index.html',
  ];

  let missingRoutes = 0;
  for (const route of requiredRoutes) {
    const fullPath = path.join('dist', route);
    if (!fs.existsSync(fullPath)) {
      console.error('FAIL: Missing required route in dist/:', route);
      missingRoutes++;
    } else {
      const stats = fs.statSync(fullPath);
      console.log(`✓ dist/${route} exists (${stats.size} bytes)`);
    }
  }

  console.log('\n--- 2. Checking Footer Links in dist/index.html ---');
  const indexHtml = fs.readFileSync(path.join('dist', 'index.html'), 'utf8');
  const requiredFooterLinks = [
    '/contacto',
    '/privacidad',
    '/terminos',
    '/divulgacion-afiliados',
    '/sobre-nosotros',
  ];

  let missingFooterLinks = 0;
  for (const link of requiredFooterLinks) {
    if (!indexHtml.includes(`href="${link}"`)) {
      console.error('FAIL: Footer does not contain link to:', link);
      missingFooterLinks++;
    } else {
      console.log(`✓ Footer contains link to: ${link}`);
    }
  }

  console.log('\n--- 3. Checking for Forbidden Testing Claims in src/ ---');
  const forbiddenKeywords = ['probamos', 'laboratorio', 'testeamos', 'nuestras pruebas', 'mes de uso', 'semanas de testeo'];
  function checkDir(dir) {
    let matches = [];
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) {
        matches = matches.concat(checkDir(p));
      } else if (/\.(astro|md|mdx|json|ts|js)$/.test(f.name)) {
        const text = fs.readFileSync(p, 'utf8');
        for (const kw of forbiddenKeywords) {
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          if (regex.test(text)) {
            matches.push({ file: p, keyword: kw });
          }
        }
      }
    }
    return matches;
  }

  const claimMatches = checkDir('src');
  if (claimMatches.length > 0) {
    console.error('FAIL: Found forbidden testing claim matches:', claimMatches);
  } else {
    console.log('✓ Zero forbidden testing claims found across src/');
  }

  console.log('\n--- 4. Checking Author Box and Person Schema in Articles ---');
  const articlePaths = [
    'smart-tv/mejores-smart-tv-calidad-precio-chile/index.html',
    'tv-abierta/como-sintonizar-canales-hd-tvd-chile/index.html',
    'accesorios/roku-vs-chromecast-chile-cual-conviene/index.html',
  ];

  let badArticles = 0;
  for (const art of articlePaths) {
    const p = path.join('dist', art);
    if (!fs.existsSync(p)) {
      console.error('FAIL: Article not found in dist:', p);
      badArticles++;
      continue;
    }
    const html = fs.readFileSync(p, 'utf8');
    const hasAuthorBox = html.includes('Luis Briones') && html.includes('/autor/luis-briones');
    const hasPersonSchema = html.includes('"@type":"Person"') && html.includes('"name":"Luis Briones"');
    
    if (!hasAuthorBox) {
      console.error('FAIL: Missing author box in', art);
      badArticles++;
    } else {
      console.log(`✓ Author box present in ${art}`);
    }

    if (!hasPersonSchema) {
      console.error('FAIL: Missing Person JSON-LD in', art);
      badArticles++;
    } else {
      console.log(`✓ Person JSON-LD schema present in ${art}`);
    }
  }

  console.log('\n--- 5. Checking Legal Disclaimer Annotations in Pages ---');
  const privHtml = fs.readFileSync(path.join('src', 'pages', 'privacidad.astro'), 'utf8');
  const termHtml = fs.readFileSync(path.join('src', 'pages', 'terminos.astro'), 'utf8');
  const hasPrivDisclaimer = privHtml.includes('REVISAR CON ABOGADO');
  const hasTermDisclaimer = termHtml.includes('REVISAR CON ABOGADO');
  console.log('privacidad.astro contains <!-- REVISAR CON ABOGADO -->:', hasPrivDisclaimer);
  console.log('terminos.astro contains <!-- REVISAR CON ABOGADO -->:', hasTermDisclaimer);

  const allPassed =
    missingRoutes === 0 &&
    missingFooterLinks === 0 &&
    claimMatches.length === 0 &&
    badArticles === 0 &&
    hasPrivDisclaimer &&
    hasTermDisclaimer;

  if (allPassed) {
    console.log('\n🎉 ALL BLOQUE B VERIFICATIONS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ SOME BLOQUE B CHECKS FAILED!');
    process.exit(1);
  }
}

testBloqueB().catch((err) => {
  console.error(err);
  process.exit(1);
});
