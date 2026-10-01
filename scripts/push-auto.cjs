const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

function run(command, description) {
  console.log(`\n⏳ ${description}...`);
  try {
    const output = execSync(command, { stdio: 'inherit', encoding: 'utf-8' });
    return true;
  } catch (error) {
    console.error(`❌ Falló: ${description}`);
    console.error(error.message);
    return false;
  }
}

function getCommitMessage() {
  const args = process.argv.slice(2).join(' ').trim();
  if (args) return args;

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CL');
  const timeStr = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  return `feat(content): actualización y nuevas entradas [${dateStr} ${timeStr}]`;
}

async function main() {
  console.log('==================================================');
  console.log('🚀 INICIANDO PROCESO DE COMPILACIÓN Y PUSH AUTOMÁTICO');
  console.log('==================================================');

  // 1. Compilación del proyecto Astro
  console.log('\n📦 Verificando y compilando el sitio...');
  try {
    execSync('npx astro build', { stdio: 'inherit' });
    console.log('✅ Compilación de Astro completada exitosamente.');
  } catch (err) {
    console.error('❌ Error durante la compilación. El push fue cancelado para proteger el repositorio.');
    process.exit(1);
  }

  // 2. Empaquetado si existe el script
  const packScript = path.join(rootDir, 'scripts', 'pack-dist.cjs');
  if (fs.existsSync(packScript)) {
    try {
      execSync('node scripts/pack-dist.cjs', { stdio: 'inherit' });
    } catch (e) {
      console.warn('⚠️ Nota: No se pudo empaquetar dist.zip, continuando con git...');
    }
  }

  // 3. Git Add
  if (!run('git add .', 'Agregando cambios a Git (git add .)')) {
    process.exit(1);
  }

  // 4. Verificar si hay cambios para commitear
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

  // 5. Verificar si existe remoto configurado y hacer push
  try {
    const remotes = execSync('git remote', { encoding: 'utf-8' }).trim();
    if (remotes.includes('origin')) {
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim() || 'main';
      console.log(`\n⬆️ Enviando cambios a GitHub (git push origin ${currentBranch})...`);
      execSync(`git push -u origin ${currentBranch}`, { stdio: 'inherit' });
      console.log('✅ ¡Push a GitHub completado con éxito!');
    } else {
      console.log('\n⚠️ No se ha configurado un repositorio remoto "origin".');
      console.log('👉 Para conectar con tu cuenta de GitHub, ejecuta:');
      console.log('   git remote add origin https://github.com/luisbrioness-arch/hogartv.git');
      console.log('   git push -u origin main');
    }
  } catch (err) {
    console.error('❌ Error al realizar git push a GitHub:', err.message);
  }

  // 6. Webhook de despliegue si está configurado en .env
  const envFile = path.join(rootDir, '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    const match = envContent.match(/DEPLOY_WEBHOOK_URL=(.+)/);
    if (match && match[1]) {
      const webhookUrl = match[1].trim();
      console.log('\n🌐 Disparando Webhook de despliegue en servidor de producción...');
      try {
        execSync(`curl.exe -s -i -X POST "${webhookUrl}"`, { stdio: 'inherit' });
        console.log('✅ Webhook de producción ejecutado.');
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
