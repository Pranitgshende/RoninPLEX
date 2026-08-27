import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG writer in pure Node.js
function createPNG(width, height, drawPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crcBuf]);
}

// Icon Drawer: RoninPLEX emblem with dark circle, glowing magenta/violet to cyan pulse waveform and play triangle
function roninPlexPixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const r = w * 0.46;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Transparent outside border
  if (dist > r) {
    return [0, 0, 0, 0];
  }

  // Dark background (#090a0f to #161928 gradient)
  const bgGrad = (y / h);
  let bgR = Math.round(9 + bgGrad * 12);
  let bgG = Math.round(10 + bgGrad * 14);
  let bgB = Math.round(15 + bgGrad * 26);

  // Outer glowing ring
  if (dist > r - 3 && dist <= r) {
    return [99, 102, 241, 255]; // Indigo-500 ring
  }

  // Draw Pulse Waveform horizontal line across center
  const waveY = cy + Math.sin(dx * 0.15) * (h * 0.18) * Math.exp(-Math.pow(dx / (w * 0.4), 2));
  const distToWave = Math.abs(y - waveY);

  if (distToWave < (w > 64 ? 2.5 : 1.5)) {
    // Glowing cyan/violet pulse line
    return [168, 85, 247, 255]; // Violet-500
  }

  // Play triangle symbol in center
  const triW = w * 0.22;
  const triH = h * 0.24;
  const triLeft = cx - triW * 0.35;
  const triRight = cx + triW * 0.65;
  const triTop = cy - triH * 0.5;
  const triBottom = cy + triH * 0.5;

  if (x >= triLeft && x <= triRight) {
    const progress = (x - triLeft) / (triRight - triLeft);
    const topLimit = cy - (triH * 0.5) * (1 - progress);
    const bottomLimit = cy + (triH * 0.5) * (1 - progress);
    if (y >= topLimit && y <= bottomLimit) {
      // Vibrant brand gradient
      return [244, 63, 94, 255]; // Rose/Brand accent
    }
  }

  return [bgR, bgG, bgB, 255];
}

// Minimal ICO writer from PNG data
function createICO(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  let offset = 6 + count * 16;
  const dirEntries = [];

  for (const { width, height, buffer } of pngBuffers) {
    const dir = Buffer.alloc(16);
    dir[0] = width >= 256 ? 0 : width;
    dir[1] = height >= 256 ? 0 : height;
    dir[2] = 0; // Color palette
    dir[3] = 0; // Reserved
    dir.writeUInt16LE(1, 4); // Color planes
    dir.writeUInt16LE(32, 6); // Bits per pixel
    dir.writeUInt32LE(buffer.length, 8); // Size of image data
    dir.writeUInt32LE(offset, 12); // Offset of image data
    dirEntries.push(dir);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

// Generate icons
const iconsDir = path.resolve('src-tauri/icons');
fs.mkdirSync(iconsDir, { recursive: true });

const png32 = createPNG(32, 32, roninPlexPixel);
const png128 = createPNG(128, 128, roninPlexPixel);
const png256 = createPNG(256, 256, roninPlexPixel);

fs.writeFileSync(path.join(iconsDir, '32x32.png'), png32);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), png128);
fs.writeFileSync(path.join(iconsDir, 'icon.png'), png256);
fs.writeFileSync(path.join(iconsDir, 'Square150x150Logo.png'), png128);

const icoBuffer = createICO([
  { width: 32, height: 32, buffer: png32 },
  { width: 128, height: 128, buffer: png128 },
  { width: 256, height: 256, buffer: png256 }
]);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);

console.log('Successfully generated RoninPLEX Tauri desktop icons!');
