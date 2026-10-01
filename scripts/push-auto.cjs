const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getCommitMessage() {
  const args = process.argv.slice(2).join(' ').trim();
  if (args) return args;

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CL');
  const timeStr = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  return `feat(content): actualización y despliegue [${dateStr} ${timeStr}]`;
}

async function main() {
  console.log('==================================================');
  console.log('🚀 INICIANDO PROCESO DE COMPILACIÓN Y DESPLIEGUE');
  console.log('==================================================');

  // 1. Compilación del proyecto Astro
  console.log('\n📦 Verificando y compilando el sitio con Astro...');
  try {
    execSync('npx astro build', { stdio: 'inherit' });
    console.log('✅ Compilación de Astro completada exitosamente.');
  } catch (err) {
    console.error('❌ Error durante la compilación. El push fue cancelado para proteger el repositorio.');
    process.exit(1);
  }

  // 2. Copiar archivos compilados a la raíz para que DirectAdmin / LiteSpeed los sirva directamente
  console.log('\n📂 Sincronizando archivos estáticos a la raíz para public_html...');
  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    copyDirRecursive(distDir, rootDir);
    console.log('✅ Archivos web colocados en la raíz listos para public_html.');
  }

  // 3. Empaquetado si existe el script
  const packScript = path.join(rootDir, 'scripts', 'pack-dist.cjs');
  if (fs.existsSync(packScript)) {
    try {
      execSync('node scripts/pack-dist.cjs', { stdio: 'inherit' });
    } catch (e) {
      console.warn('⚠️ Nota: No se pudo empaquetar dist.zip, continuando con git...');
    }
  }

  // 4. Git Add
  console.log('\n⏳ Agregando cambios a Git (git add .)...');
  try {
    execSync('git add .', { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Error al agregar archivos a Git:', e.message);
    process.exit(1);
  }

  // 5. Verificar si hay cambios para commitear
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    if (!status) {
      console.log('\nℹ️ No hay cambios pendientes por guardar en Git.');
    } else {
      const commitMsg = getCommitMessage();
      console.log(`\n📝 Creando commit: "${commitMsg}"`);
      execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log('✅ Commit realizado con éxito.');
    }
  } catch (err) {
    console.error('⚠️ Error al generar commit:', err.message);
  }

  // 6. Push a GitHub (rama main)
  try {
    const remotes = execSync('git remote', { encoding: 'utf-8' }).trim();
    if (remotes.includes('origin')) {
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim() || 'main';
      console.log(`\n⬆️ Enviando cambios a GitHub (git push origin ${currentBranch})...`);
      execSync(`git push -u origin ${currentBranch}`, { stdio: 'inherit' });
      console.log('✅ ¡Push a GitHub completado con éxito!');
    }
  } catch (err) {
    console.error('❌ Error al realizar git push a GitHub:', err.message);
  }

  // 7. Webhook de despliegue si está configurado en .env
  const envFile = path.join(rootDir, '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    const match = envContent.match(/DEPLOY_WEBHOOK_URL=(.+)/);
    if (match && match[1]) {
      const webhookUrl = match[1].trim();
      console.log('\n🌐 Disparando Webhook de despliegue en DirectAdmin...');
      try {
        execSync(`curl.exe -s -i -X POST "${webhookUrl}"`, { stdio: 'inherit' });
        console.log('✅ Webhook ejecutado.');
      } catch (e) {
        console.warn('⚠️ No se pudo disparar el webhook de despliegue:', e.message);
      }
    }
  }

  console.log('\n==================================================');
  console.log('🎉 PROCESO COMPLETADO');
  console.log('==================================================\n');
}

main();
