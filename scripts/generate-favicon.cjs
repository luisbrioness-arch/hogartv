const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateFavicon() {
  const svgPath = path.join('public', 'favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Render to 32x32 PNG buffer
  const png32 = await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();

  // Render to 16x16 PNG buffer
  const png16 = await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toBuffer();

  // Construct standard Windows ICO format containing 16x16 and 32x32 PNGs
  // ICO Header: 2 bytes reserved (0), 2 bytes type (1 = icon), 2 bytes image count (2)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(2, 4);

  // Image entries (16 bytes each)
  // Entry 1: 16x16
  const entry1 = Buffer.alloc(16);
  entry1.writeUInt8(16, 0); // width
  entry1.writeUInt8(16, 1); // height
  entry1.writeUInt8(0, 2);  // color palette
  entry1.writeUInt8(0, 3);  // reserved
  entry1.writeUInt16LE(1, 4); // color planes
  entry1.writeUInt16LE(32, 6); // bits per pixel
  entry1.writeUInt32LE(png16.length, 8); // image size in bytes
  entry1.writeUInt32LE(6 + 16 * 2, 12); // offset

  // Entry 2: 32x32
  const entry2 = Buffer.alloc(16);
  entry2.writeUInt8(32, 0); // width
  entry2.writeUInt8(32, 1); // height
  entry2.writeUInt8(0, 2);  // color palette
  entry2.writeUInt8(0, 3);  // reserved
  entry2.writeUInt16LE(1, 4); // color planes
  entry2.writeUInt16LE(32, 6); // bits per pixel
  entry2.writeUInt32LE(png32.length, 8); // image size in bytes
  entry2.writeUInt32LE(6 + 16 * 2 + png16.length, 12); // offset

  const icoBuffer = Buffer.concat([header, entry1, entry2, png16, png32]);
  fs.writeFileSync(path.join('public', 'favicon.ico'), icoBuffer);
  console.log('Successfully generated public/favicon.ico (16x16 + 32x32)! Total bytes:', icoBuffer.length);
}

generateFavicon().catch(err => {
  console.error(err);
  process.exit(1);
});
