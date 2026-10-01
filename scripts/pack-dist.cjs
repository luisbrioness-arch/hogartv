const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const zipPath = path.join(rootDir, 'dist.zip');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ no existe. Ejecuta primero npm run build.');
  process.exit(1);
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Ejecutar tar desde dentro del directorio dist para empaquetar con forward slashes
console.log('Empaquetando dist/ en dist.zip con rutas POSIX estándar...');
process.chdir(distDir);
execSync(`tar -a -c -f "${zipPath}" *`);
process.chdir(rootDir);

const stats = fs.statSync(zipPath);
console.log(`✅ dist.zip generado exitosamente (${(stats.size / 1024).toFixed(1)} KB)`);

// Verificar estructura interna de dist.zip
const listing = execSync(`tar -tf "${zipPath}"`).toString();
const hasBackslash = listing.includes('\\');
if (hasBackslash) {
  console.error('❌ ERROR: El archivo zip contiene separadores de barra invertida (\\)');
  process.exit(1);
} else {
  console.log('✅ Verificación POSIX: Todas las rutas usan barras diagonales (/) compatibles con Linux/LiteSpeed.');
}
