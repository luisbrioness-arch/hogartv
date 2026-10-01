const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) results = results.concat(getHtmlFiles(p));
    else if (f.name.endsWith('.html')) results.push(p);
  }
  return results;
}

async function testBloqueC() {
  console.log('=== VERIFICACIÓN BLOQUE C: SEO TÉCNICO Y PERFORMANCE ===\n');

  let hasErrors = false;
  const htmlFiles = getHtmlFiles('dist');

  // ----------------------------------------------------
  // C1: JSON-LD Schemas
  // ----------------------------------------------------
  console.log('--- C1: Validando Schemas JSON-LD ---');
  let breadcrumbCount = 0;
  let howToCount = 0;
  let itemListCount = 0;
  let organizationCount = 0;

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const isHome = path.normalize(file) === path.normalize('dist/index.html');
    const scriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;
    let schemasInFile = [];

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        schemasInFile.push(parsed);
      } catch (err) {
        console.error(`FAIL: Invalid JSON-LD in ${file}:`, err.message);
        hasErrors = true;
      }
    }

    // 1. BreadcrumbList check
    const breadcrumbs = schemasInFile.filter(s => s['@type'] === 'BreadcrumbList');
    if (isHome) {
      if (breadcrumbs.length > 0) {
        console.error('FAIL: Home page should NOT have BreadcrumbList schema!');
        hasErrors = true;
      }
    } else {
      if (breadcrumbs.length === 0) {
        console.error(`FAIL: Missing BreadcrumbList schema in ${file}`);
        hasErrors = true;
      } else {
        breadcrumbCount++;
        const b = breadcrumbs[0];
        if (!Array.isArray(b.itemListElement) || b.itemListElement.length < 2) {
          console.error(`FAIL: BreadcrumbList has invalid itemListElement in ${file}`);
          hasErrors = true;
        }
      }
    }

    // 2. Organization check on Home
    if (isHome) {
      const org = schemasInFile.find(s => s['@type'] === 'Organization');
      if (!org || org.name !== 'HogarTV.cl' || !org.url || !org.logo) {
        console.error('FAIL: Missing or invalid Organization schema on home page');
        hasErrors = true;
      } else {
        organizationCount++;
        console.log('✓ Organization schema valid on home page');
      }
    }

    // 3. HowTo check
    const howTos = schemasInFile.filter(s => s['@type'] === 'HowTo');
    if (file.includes('como-sintonizar-canales-hd-tvd-chile')) {
      if (howTos.length === 0) {
        console.error(`FAIL: Missing HowTo schema in ${file}`);
        hasErrors = true;
      } else {
        howToCount++;
        const h = howTos[0];
        if (!h.step || h.step.length < 3 || !h.supply || !h.tool) {
          console.error(`FAIL: HowTo schema incomplete in ${file}`);
          hasErrors = true;
        } else {
          console.log(`✓ HowTo schema with ${h.step.length} steps valid in TVD guide`);
        }
      }
    }

    // 4. ItemList check in categories
    const isCategory = /dist[\\/](smart-tv|streaming|tv-abierta|accesorios)[\\/]index\.html$/.test(file);
    if (isCategory) {
      const itemLists = schemasInFile.filter(s => s['@type'] === 'ItemList');
      if (itemLists.length === 0) {
        console.error(`FAIL: Missing ItemList schema in category ${file}`);
        hasErrors = true;
      } else {
        itemListCount++;
        console.log(`✓ ItemList schema valid in ${file}`);
      }
    }
  }

  console.log(`✓ Total BreadcrumbList valid across inner pages: ${breadcrumbCount}`);
  console.log(`✓ Total ItemList valid across 4 categories: ${itemListCount}`);

  // ----------------------------------------------------
  // C2: Jerarquía de Headings (H1-H6)
  // ----------------------------------------------------
  console.log('\n--- C2: Validando Jerarquía de Headings (H1-H6) ---');
  let headingSkipsCount = 0;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let match;
    let headings = [];
    while ((match = regex.exec(html)) !== null) {
      headings.push({ level: parseInt(match[1], 10), text: match[2].replace(/<[^>]*>/g, '').trim().slice(0, 30) });
    }

    const h1Count = headings.filter(h => h.level === 1).length;
    if (h1Count !== 1) {
      console.error(`FAIL: ${file} has ${h1Count} <h1> tags (must have exactly 1)`);
      hasErrors = true;
    }

    let prevLevel = 0;
    for (const h of headings) {
      if (prevLevel > 0 && h.level > prevLevel + 1) {
        console.error(`FAIL: Heading skip in ${file}: H${prevLevel} -> H${h.level} ("${h.text}")`);
        headingSkipsCount++;
        hasErrors = true;
      }
      prevLevel = h.level;
    }
  }
  if (headingSkipsCount === 0) {
    console.log(`✓ All ${htmlFiles.length} pages have exactly 1 H1 and 0 hierarchy skips`);
  }

  // ----------------------------------------------------
  // C3: Rendimiento web y fuentes
  // ----------------------------------------------------
  console.log('\n--- C3: Validando Rendimiento y Fuentes Locales ---');
  let externalRequests = 0;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      const headContent = headMatch[1];
      if (headContent.includes('fonts.googleapis.com') || headContent.includes('fonts.gstatic.com')) {
        console.error(`FAIL: External Google Fonts found in <head> of ${file}`);
        externalRequests++;
        hasErrors = true;
      }
    }
  }
  if (externalRequests === 0) {
    console.log('✓ Zero external Google Fonts requests found in <head>');
  }

  // Check CSS & client JS size
  const astroDir = path.join('dist', '_astro');
  if (fs.existsSync(astroDir)) {
    const assetFiles = fs.readdirSync(astroDir);
    let totalJs = 0;
    let totalCss = 0;
    for (const f of assetFiles) {
      const sz = fs.statSync(path.join(astroDir, f)).size;
      if (f.endsWith('.js')) totalJs += sz;
      if (f.endsWith('.css')) totalCss += sz;
    }
    console.log(`✓ Total client JS generated: ${(totalJs / 1024).toFixed(2)} KB`);
    console.log(`✓ Total CSS bundle generated: ${(totalCss / 1024).toFixed(2)} KB`);
  }

  // ----------------------------------------------------
  // C4: Configuración .htaccess
  // ----------------------------------------------------
  console.log('\n--- C4: Validando public/.htaccess ---');
  const htaccess = fs.readFileSync('public/.htaccess', 'utf8');
  const checks = [
    { label: 'Trailing slash canonical redirect', test: htaccess.includes('RewriteRule ^(.*[^/])$ https://hogartv.cl/$1/ [L,R=301]') },
    { label: 'Canonical www to non-www redirect', test: htaccess.includes('RewriteCond %{HTTP_HOST} ^www\\.hogartv\\.cl$ [NC]') },
    { label: 'X-Content-Type-Options nosniff', test: htaccess.includes('X-Content-Type-Options "nosniff"') },
    { label: 'X-Frame-Options SAMEORIGIN', test: htaccess.includes('X-Frame-Options "SAMEORIGIN"') },
    { label: 'Referrer-Policy strict-origin-when-cross-origin', test: htaccess.includes('Referrer-Policy "strict-origin-when-cross-origin"') },
    { label: 'Permissions-Policy header', test: htaccess.includes('Permissions-Policy "camera=()') },
    { label: 'Immutable cache for static assets', test: htaccess.includes('max-age=31536000, public, immutable') },
    { label: 'Gzip / Deflate compression', test: htaccess.includes('AddOutputFilterByType DEFLATE') },
  ];

  for (const c of checks) {
    if (!c.test) {
      console.error(`FAIL: Missing directive in .htaccess: ${c.label}`);
      hasErrors = true;
    } else {
      console.log(`✓ ${c.label} present`);
    }
  }

  // ----------------------------------------------------
  // C5: Favicon.ico y RSS feed
  // ----------------------------------------------------
  console.log('\n--- C5: Validando Favicon.ico y Feed RSS ---');
  const favPub = path.join('public', 'favicon.ico');
  const favDist = path.join('dist', 'favicon.ico');
  const rssDist = path.join('dist', 'rss.xml');

  if (!fs.existsSync(favPub) || !fs.existsSync(favDist)) {
    console.error('FAIL: favicon.ico missing in public or dist');
    hasErrors = true;
  } else {
    console.log(`✓ favicon.ico valid in public/ and dist/ (${fs.statSync(favDist).size} bytes)`);
  }

  if (!fs.existsSync(rssDist)) {
    console.error('FAIL: dist/rss.xml does not exist');
    hasErrors = true;
  } else {
    const rssContent = fs.readFileSync(rssDist, 'utf8');
    const has3Items = (rssContent.match(/<item>/g) || []).length === 3;
    const hasChannel = rssContent.includes('<title>HogarTV.cl - Guías de TV, Streaming y TVD en Chile</title>');
    if (!has3Items || !hasChannel) {
      console.error('FAIL: rss.xml does not contain expected items or metadata');
      hasErrors = true;
    } else {
      console.log('✓ dist/rss.xml valid RSS 2.0 with all 3 published articles');
    }
  }

  // Check <link rel="alternate" type="application/rss+xml"> in dist/index.html
  const homeHtml = fs.readFileSync(path.join('dist', 'index.html'), 'utf8');
  if (!homeHtml.includes('type="application/rss+xml"')) {
    console.error('FAIL: Missing RSS alternate link in <head>');
    hasErrors = true;
  } else {
    console.log('✓ <link rel="alternate" type="application/rss+xml"> present in <head>');
  }

  if (!hasErrors) {
    console.log('\n🎉 ALL BLOQUE C VERIFICATIONS PASSED 100%!');
  } else {
    console.error('\n❌ SOME BLOQUE C VERIFICATIONS FAILED!');
    process.exit(1);
  }
}

testBloqueC().catch(err => {
  console.error(err);
  process.exit(1);
});
