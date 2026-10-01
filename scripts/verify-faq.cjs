const fs = require('fs');
const path = require('path');

const htmlPath = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('dist/index.html no encontrado.');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// 1. Verificar texto visible
const hasOldText = html.includes('monitoreamos tiendas');
const hasNewText = html.includes('Corresponden a valores referenciales tomados en la fecha indicada');

console.log('--- 1. Verificación de Texto Visible en dist/index.html ---');
console.log('¿Contiene afirmación antigua sin respaldo?:', hasOldText ? '❌ SÍ (Fallo)' : '✅ NO');
console.log('¿Contiene redacción nueva transparente?:', hasNewText ? '✅ SÍ' : '❌ NO');

// 2. Extraer schema FAQPage de JSON-LD
const scriptMatches = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)];
let faqSchemaFound = null;

for (const m of scriptMatches) {
  try {
    const data = JSON.parse(m[1]);
    if (data['@type'] === 'FAQPage') {
      faqSchemaFound = data;
      break;
    }
  } catch (e) {}
}

console.log('\n--- 2. Verificación de Schema.org FAQPage (JSON-LD) ---');
if (!faqSchemaFound) {
  console.error('❌ ERROR: FAQPage Schema no fue encontrado en dist/index.html');
  process.exit(1);
}

const priceQuestion = faqSchemaFound.mainEntity.find(q => q.name && q.name.includes('precios'));
if (!priceQuestion) {
  console.error('❌ ERROR: Pregunta sobre precios no encontrada en el FAQPage Schema');
  process.exit(1);
}

const schemaText = priceQuestion.acceptedAnswer.text;
const schemaHasOldText = schemaText.includes('monitoreamos tiendas');
const schemaHasNewText = schemaText.includes('Corresponden a valores referenciales tomados en la fecha indicada');

console.log('Pregunta:', priceQuestion.name);
console.log('Respuesta en schema:', schemaText);
console.log('¿Schema contiene afirmación antigua?:', schemaHasOldText ? '❌ SÍ (Fallo)' : '✅ NO');
console.log('¿Schema contiene texto nuevo verificado?:', schemaHasNewText ? '✅ SÍ' : '❌ NO');

if (!hasOldText && hasNewText && !schemaHasOldText && schemaHasNewText) {
  console.log('\n✅ ÉXITO: Tanto el texto visible como el JSON-LD FAQPage reflejan fielmente la política de precios.');
  process.exit(0);
} else {
  console.error('\n❌ ERROR: Discrepancia encontrada en la verificación.');
  process.exit(1);
}
