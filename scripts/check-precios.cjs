const fs = require('fs');
const path = require('path');

function checkPrecios() {
  const preciosPath = path.join('src', 'data', 'precios.json');
  if (!fs.existsSync(preciosPath)) {
    console.error('ERROR: No se encontró src/data/precios.json');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(preciosPath, 'utf8'));
  const now = new Date();
  let outdatedCount = 0;
  let totalCount = 0;

  console.log('====================================================');
  console.log('   ESTADO DE PRECIOS HOGARTV.CL (src/data/precios.json)');
  console.log('====================================================\n');

  for (const [key, item] of Object.entries(data)) {
    totalCount++;
    const vDate = new Date(item.fechaVerificacion);
    const diffMs = now.getTime() - vDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const isOutdated = diffDays > 30;

    const statusTag = isOutdated
      ? `\x1b[33m[ADVERTENCIA: ${diffDays} días sin verificar]\x1b[0m`
      : `\x1b[32m[AL DÍA (${diffDays} días)]\x1b[0m`;

    console.log(`• Producto: ${key}`);
    console.log(`  Precio: ${item.precioFormateado} (Rango: ${item.rango})`);
    console.log(`  Tienda: ${item.tiendaReferencia}`);
    console.log(`  Verificado: ${item.fechaVerificacion} ${statusTag}`);
    if (item.TODO) {
      console.log(`  TODO: ${item.TODO}`);
    }
    console.log('----------------------------------------------------');

    if (isOutdated) outdatedCount++;
  }

  console.log(`\nResumen: ${totalCount} productos monitoreados.`);
  if (outdatedCount > 0) {
    console.log(`⚠️  ${outdatedCount} producto(s) llevan más de 30 días sin verificar precio.`);
  } else {
    console.log('✅ Todos los precios fueron verificados en los últimos 30 días.');
  }
}

checkPrecios();
