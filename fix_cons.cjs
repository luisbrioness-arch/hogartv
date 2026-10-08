const fs = require('fs');

const files = [
  'src/content/articles/como-sintonizar-canales-hd-tvd-chile.mdx',
  'src/content/articles/mejores-smart-tv-calidad-precio-chile.mdx',
  'src/content/articles/roku-vs-chromecast-chile-cual-conviene.mdx',
  'src/content/articles/zapping-vs-dgo-chile-cual-conviene.mdx',
  'src/pages/recomendados.astro'
];

const replacements = {
  'tcl-c655-55': 'cons={[\n    "Requiere cable HDMI 2.1 para jugar a 144Hz en consolas de última generación"\n  ]}',
  'hisense-u6k-55': 'cons={[\n    "El diseño de las patas de soporte requiere un mueble bastante ancho"\n  ]}',
  'samsung-du7000-55': 'cons={[\n    "No soporta Dolby Vision (solo HDR10+)",\n    "Brillo en SDR inferior a los modelos QLED de gama media"\n  ]}',
  'roku-express-4k': 'cons={[\n    "No permite instalar aplicaciones fuera de su tienda oficial (no soporta APKs Android)"\n  ]}',
  'chromecast-google-tv': 'cons={[\n    "Almacenamiento interno limitado (4GB libres) si instalas demasiadas aplicaciones"\n  ]}',
  'antena-tvd-chile': 'cons={[\n    "En sótanos o zonas muy alejadas de la antena repetidora puede requerir una instalación de techo"\n  ]}'
};

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    for (const [key, replacement] of Object.entries(replacements)) {
      const regex = new RegExp(`productKey="${key}"[\\s\\S]*?cons={\\[\\]}`, 'g');
      content = content.replace(regex, (match) => {
        return match.replace('cons={[]}', replacement);
      });
    }

    fs.writeFileSync(file, content, 'utf8');
  }
});
