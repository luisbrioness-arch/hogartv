const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('   TESTING PUNTO 1: ANALÍTICA Y SEARCH CONSOLE');
console.log('====================================================\n');

// 1. Test build SIN variables de entorno
console.log('--- Caso 1: Build sin variables de entorno (vacías) ---');
if (fs.existsSync('.env')) fs.unlinkSync('.env');

execSync('npm.cmd run build', { stdio: 'inherit' });

const htmlEmpty = fs.readFileSync(path.join('dist', 'index.html'), 'utf8');

const hasGtagEmpty = htmlEmpty.includes('googletagmanager') || htmlEmpty.includes('gtag');
const hasGscEmpty = htmlEmpty.includes('google-site-verification');
const hasCommentGA4 = htmlEmpty.includes('Google Analytics 4');
const hasCommentGSC = htmlEmpty.includes('Google Search Console');

console.log('¿Contiene gtag sin variable?:', hasGtagEmpty);
console.log('¿Contiene GSC meta sin variable?:', hasGscEmpty);
console.log('¿Contiene comentarios residuales de GA4?:', hasCommentGA4);
console.log('¿Contiene comentarios residuales de GSC?:', hasCommentGSC);

if (hasGtagEmpty || hasGscEmpty || hasCommentGA4 || hasCommentGSC) {
  console.error('❌ FALLÓ Caso 1: Se encontraron scripts, metas o comentarios cuando las variables están vacías.');
  process.exit(1);
} else {
  console.log('✅ PASS Caso 1: Cero scripts, cero metas, cero comentarios en HTML cuando no hay variables.\n');
}

// 2. Test build CON variables de entorno en producción
console.log('--- Caso 2: Build con PUBLIC_GA4_ID y PUBLIC_GSC_VERIFICATION ---');
fs.writeFileSync('.env', 'PUBLIC_GA4_ID=G-TEST123456\nPUBLIC_GSC_VERIFICATION=gsc-token-verification-test\n');

execSync('npm.cmd run build', { stdio: 'inherit' });

const htmlFull = fs.readFileSync(path.join('dist', 'index.html'), 'utf8');

const countGtagScript = (htmlFull.match(/https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-TEST123456/g) || []).length;
const countGscMeta = (htmlFull.match(/<meta name="google-site-verification" content="gsc-token-verification-test"/g) || []).length;
const hasAsync = htmlFull.includes('async src="https://www.googletagmanager.com/gtag/js?id=G-TEST123456"');

console.log('Conteo script gtag:', countGtagScript);
console.log('Conteo meta GSC:', countGscMeta);
console.log('¿Script gtag incluye async?:', hasAsync);

if (countGtagScript === 1 && countGscMeta === 1 && hasAsync) {
  console.log('✅ PASS Caso 2: El script GA4 y la meta GSC se inyectaron exactamente una vez y con atributo async.\n');
} else {
  console.error('❌ FALLÓ Caso 2: No se inyectaron adecuadamente.');
  if (fs.existsSync('.env')) fs.unlinkSync('.env');
  process.exit(1);
}

// Limpiar .env de prueba y reconstruir en limpio
if (fs.existsSync('.env')) fs.unlinkSync('.env');
execSync('npm.cmd run build', { stdio: 'pipe' });
console.log('✅ Entorno limpiado y dist reconstruido limpio.');
console.log('\n🎉 PUNTO 1 VERIFICADO EXITOSAMENTE AL 100%.');
