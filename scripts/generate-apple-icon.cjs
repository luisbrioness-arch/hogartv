const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svg180 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" fill="none" width="180" height="180">
  <rect width="180" height="180" rx="40" fill="#2563eb"/>
  <g transform="translate(18, 18) scale(4.5)">
    <path d="M7 8H25C26.1046 8 27 8.89543 27 10V20C27 21.1046 26.1046 22 25 22H7C5.89543 22 5 21.1046 5 20V10C5 8.89543 5.89543 8 7 8Z" stroke="white" stroke-width="1.8"/>
    <path d="M12 25H20" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M16 22V25" stroke="white" stroke-width="1.8"/>
    <circle cx="16" cy="15" r="2.5" fill="#93c5fd"/>
  </g>
</svg>`;

const outputPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png');

sharp(Buffer.from(svg180))
  .resize(180, 180)
  .png()
  .toFile(outputPath)
  .then(info => {
    console.log('✅ Generated public/apple-touch-icon.png:', info);
  })
  .catch(err => {
    console.error('❌ Error generating apple-touch-icon:', err);
    process.exit(1);
  });
