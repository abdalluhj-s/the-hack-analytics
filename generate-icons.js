import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG generator using built-in Node.js modules (no external deps)
function createPng(width, height, r, g, b, iconType = 'wrench') {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dark automotive background (#0c121e)
      let pr = 12;
      let pg = 18;
      let pb = 30;
      let pa = 255;

      // Outer rounded badge with gold gradient border (#f59e0b)
      if (dist < radius) {
        if (dist > radius - width * 0.04) {
          // Border
          pr = 245;
          pg = 158;
          pb = 11;
        } else {
          // Inner gradient
          const factor = (y / height);
          pr = Math.round(15 + factor * 20);
          pg = Math.round(23 + factor * 15);
          pb = Math.round(42 + factor * 10);

          // Golden center emblem (Car / Wrench silhouette approximation)
          const ndx = Math.abs(dx) / (width * 0.25);
          const ndy = Math.abs(dy) / (height * 0.25);
          if (ndx < 1 && ndy < 1 && (ndx * ndx + ndy * ndy < 1)) {
            pr = 245;
            pg = 158;
            pb = 11;
          }
        }
      }

      buffer[idx] = pr;
      buffer[idx + 1] = pg;
      buffer[idx + 2] = pb;
      buffer[idx + 3] = pa;
    }
  }

  // PNG structure
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT: filter byte 0 prepended to each scanline
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (width * 4 + 1);
    scanlines[scanlineOffset] = 0; // Filter type None
    buffer.copy(scanlines, scanlineOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(length + 12);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, length + 8));
  chunk.writeInt32BE(crc, length + 8);
  return chunk;
}

// CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ -1;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write PNG files
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192, 192, 245, 158, 11));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512, 512, 245, 158, 11));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, 245, 158, 11));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable.png'), createPng(512, 512, 245, 158, 11));

console.log('Icons generated successfully in public directory!');
