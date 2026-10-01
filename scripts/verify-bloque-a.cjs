const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function test() {
  console.log('--- 1. Testing og-image.png ---');
  const ogPub = path.join('public', 'og-image.png');
  const ogDist = path.join('dist', 'og-image.png');
  const metaPub = await sharp(ogPub).metadata();
  const metaDist = await sharp(ogDist).metadata();
  console.log('public/og-image.png:', metaPub.width, 'x', metaPub.height);
  console.log('dist/og-image.png:', metaDist.width, 'x', metaDist.height);

  console.log('\n--- 2. Checking HTML files in dist/ ---');
  function getHtmlFiles(dir) {
    let results = [];
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) results = results.concat(getHtmlFiles(p));
      else if (f.name.endsWith('.html')) results.push(p);
    }
    return results;
  }
  const htmls = getHtmlFiles('dist');
  let badLinks = 0;
  let totalAffiliateLinks = 0;
  for (const file of htmls) {
    const html = fs.readFileSync(file, 'utf8');
    
    // check og:image
    const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (!ogMatch) {
      console.warn('WARNING: Missing og:image in', file);
    } else if (!ogMatch[1].startsWith('http')) {
      console.warn('WARNING: Non-absolute og:image in', file, ogMatch[1]);
    }

    // check links to mercadolibre or other stores
    const regex = /<a\s+[^>]*href=["'](https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:mercadolibre|amazon|falabella|ripley|paris|meli)\.[a-zA-Z0-9./?=&_%+-]+)["'][^>]*>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      totalAffiliateLinks++;
      const tag = match[0];
      const hasRel = /rel="nofollow sponsored noopener"/i.test(tag) || 
                     (/nofollow/i.test(tag) && /sponsored/i.test(tag) && /noopener/i.test(tag));
      const hasTarget = /target="_blank"/i.test(tag);
      if (!hasRel || !hasTarget) {
        console.error('FAIL: Link without proper rel/target in', file, tag);
        badLinks++;
      }
    }
  }
  console.log('Total HTML files analyzed:', htmls.length);
  console.log('Total store/affiliate links found in build:', totalAffiliateLinks);
  console.log('Non-compliant store links:', badLinks);

  console.log('\n--- 3. Checking hardcoded store URLs outside afiliados.json ---');
  function searchSourceFiles(dir) {
    let badCode = 0;
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) {
        badCode += searchSourceFiles(p);
      } else if (f.name.endsWith('.astro') || f.name.endsWith('.md') || f.name.endsWith('.mdx')) {
        const content = fs.readFileSync(p, 'utf8');
        const match = content.match(/https?:\/\/[a-zA-Z0-9.-]*mercadolibre[^\s"'`<>]+/g);
        if (match) {
          console.error('FAIL: Hardcoded Mercado Libre URL found in source file:', p, match);
          badCode += match.length;
        }
      }
    }
    return badCode;
  }
  const hardcodedCount = searchSourceFiles('src');
  console.log('Hardcoded store URLs in src/ templates/content:', hardcodedCount);

  console.log('\n--- 4. Checking BaseLayout analytics & GSC conditional check ---');
  const baseLayout = fs.readFileSync('src/layouts/BaseLayout.astro', 'utf8');
  const hasGa4Condition = baseLayout.includes('import.meta.env.PUBLIC_GA4_ID');
  const hasGscCondition = baseLayout.includes('import.meta.env.PUBLIC_GSC_VERIFICATION');
  console.log('GA4 conditional check in BaseLayout:', hasGa4Condition);
  console.log('GSC conditional check in BaseLayout:', hasGscCondition);

  if (metaDist.width === 1200 && metaDist.height === 630 && badLinks === 0 && hardcodedCount === 0 && hasGa4Condition && hasGscCondition) {
    console.log('\n✅ ALL BLOQUE A CHECKS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ SOME BLOQUE A CHECKS FAILED!');
    process.exit(1);
  }
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
