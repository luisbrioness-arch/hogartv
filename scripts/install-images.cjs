const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brainDir = 'C:/Users/DREAMFYRE 7/.gemini/antigravity/brain/8618d562-ecca-4453-818a-76e673ca921c';
const projectRoot = path.join(__dirname, '..');

const images = [
  {
    src: 'luis_briones_headshot_1789709805820.jpg',
    dest: 'src/assets/autores/luis-briones.webp',
    width: 400,
    height: 400,
    fit: 'cover'
  },
  {
    src: 'smart_tv_hero_1789709833276.jpg',
    dest: 'src/assets/smart-tv/mejores-smart-tv-calidad-precio-chile/hero.webp',
    width: 1200,
    height: 675,
    fit: 'cover'
  },
  {
    src: 'tcl_c655_tv_1789709868962.jpg',
    dest: 'src/assets/smart-tv/mejores-smart-tv-calidad-precio-chile/tcl-c655-55.webp',
    width: 800,
    height: 600,
    fit: 'cover'
  },
  {
    src: 'hisense_u6k_tv_1789709941260.jpg',
    dest: 'src/assets/smart-tv/mejores-smart-tv-calidad-precio-chile/hisense-u6k-55.webp',
    width: 800,
    height: 600,
    fit: 'cover'
  },
  {
    src: 'samsung_du7000_tv_1789709972711.jpg',
    dest: 'src/assets/smart-tv/mejores-smart-tv-calidad-precio-chile/samsung-du7000-55.webp',
    width: 800,
    height: 600,
    fit: 'cover'
  },
  {
    src: 'tvd_chile_hero_1789710020809.jpg',
    dest: 'src/assets/tv-abierta/como-sintonizar-canales-hd-tvd-chile/hero.webp',
    width: 1200,
    height: 675,
    fit: 'cover'
  },
  {
    src: 'antena_tvd_chile_1789710062738.jpg',
    dest: 'src/assets/tv-abierta/como-sintonizar-canales-hd-tvd-chile/antena-tvd-chile.webp',
    width: 800,
    height: 600,
    fit: 'cover'
  },
  {
    src: 'roku_chromecast_hero_1789710106163.jpg',
    dest: 'src/assets/accesorios/roku-vs-chromecast-chile-cual-conviene/hero.webp',
    width: 1200,
    height: 675,
    fit: 'cover'
  },
  {
    src: 'roku_express_product_1789710151450.jpg',
    dest: 'src/assets/accesorios/roku-vs-chromecast-chile-cual-conviene/roku-express-4k.webp',
    width: 800,
    height: 600,
    fit: 'cover'
  },
  {
    src: 'chromecast_gtv_product_1789710602209.jpg',
    dest: 'src/assets/accesorios/roku-vs-chromecast-chile-cual-conviene/chromecast-google-tv.webp',
    width: 800,
    height: 600,
    fit: 'cover'
  }
];

async function run() {
  console.log('Optimizando e instalando las 10 imágenes...');
  for (const img of images) {
    const srcPath = path.join(brainDir, img.src);
    const destPath = path.join(projectRoot, img.dest);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    await sharp(srcPath)
      .resize(img.width, img.height, { fit: img.fit })
      .webp({ quality: 85, effort: 6 })
      .toFile(destPath);

    const stat = fs.statSync(destPath);
    console.log(`✅ ${img.dest} (${img.width}x${img.height}) - ${(stat.size / 1024).toFixed(1)} KB`);
  }
  console.log('\n🎉 ¡Todas las 10 imágenes fueron instaladas con éxito en formato WebP!');
}

run().catch(err => {
  console.error('Error al procesar imágenes:', err);
  process.exit(1);
});
