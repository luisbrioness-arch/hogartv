const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Gradient -->
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>

      <!-- Glow radial -->
      <radialGradient id="glow" cx="20%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#4f46e5" stop-opacity="0"/>
      </radialGradient>

      <!-- Accent gradient -->
      <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#818cf8"/>
        <stop offset="50%" stop-color="#a5b4fc"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>
    </defs>

    <!-- Base Canvas -->
    <rect width="${width}" height="${height}" fill="url(#bg-grad)"/>
    <rect width="${width}" height="${height}" fill="url(#glow)"/>

    <!-- Subtle frame -->
    <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="28" fill="none" stroke="#1e293b" stroke-width="2"/>

    <!-- Brand Header Badge -->
    <g transform="translate(80, 80)">
      <rect width="210" height="42" rx="21" fill="#1e1b4b" stroke="#3730a3" stroke-width="1.5"/>
      <circle cx="24" cy="21" r="6" fill="#10b981"/>
      <text x="40" y="26" fill="#c7d2fe" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" letter-spacing="1">PORTAL CHILE 🇨🇱</text>
    </g>

    <!-- TV Logo Icon -->
    <g transform="translate(80, 160)">
      <rect width="84" height="84" rx="22" fill="#4f46e5"/>
      <!-- Screen icon -->
      <rect x="18" y="22" width="48" height="34" rx="6" fill="none" stroke="#ffffff" stroke-width="4"/>
      <line x1="32" y1="62" x2="52" y2="62" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      <line x1="42" y1="56" x2="42" y2="62" stroke="#ffffff" stroke-width="4"/>
      <circle cx="42" cy="39" r="5" fill="#a5b4fc"/>
    </g>

    <!-- Title -->
    <g transform="translate(185, 222)">
      <text fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="900" letter-spacing="-1.5">
        Hogar<tspan fill="url(#brand-grad)">TV</tspan><tspan fill="#818cf8" font-size="36" font-weight="700">.cl</tspan>
      </text>
    </g>

    <!-- Headline -->
    <g transform="translate(80, 320)">
      <text fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" letter-spacing="-1">
        Guía Experta en Smart TVs,
      </text>
      <text y="56" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="40" font-weight="700" letter-spacing="-0.5">
        Streaming y Televisión Digital en Chile
      </text>
    </g>

    <!-- Feature Badges Bottom -->
    <g transform="translate(80, 480)">
      <!-- Badge 1 -->
      <rect x="0" y="0" width="280" height="52" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <text x="24" y="32" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600">📺 Comparativas Técnicas</text>

      <!-- Badge 2 -->
      <rect x="300" y="0" width="260" height="52" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <text x="324" y="32" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600">📡 Guías TVD Abierta</text>

      <!-- Badge 3 -->
      <rect x="580" y="0" width="240" height="52" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <text x="604" y="32" fill="#10b981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">💰 Precios en CLP</text>
    </g>

    <!-- Footer URL -->
    <g transform="translate(1040, 560)">
      <text text-anchor="end" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" font-mono="true">
        https://hogartv.cl
      </text>
    </g>
  </svg>
  `;

  const outputPath = path.resolve(__dirname, '../public/og-image.png');
  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log('og-image.png generado exitosamente en:', outputPath);
}

generateOgImage().catch(console.error);
