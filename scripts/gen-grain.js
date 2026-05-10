#!/usr/bin/env node
/**
 * Generate assets/textures/paper-grain.png — 4×4 RGBA tile with one ink dot at (1,1) at 7% alpha.
 * Mirrors the paper.jsx grain spec: radial-gradient(rgba(26,24,21,0.07) 0.5px, transparent 0.5px) / 4px 4px.
 *
 * Run once: node scripts/gen-grain.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 4, H = 4;
const INK_R = 26, INK_G = 24, INK_B = 21;
const ALPHA = Math.round(0.07 * 255); // 18

const rows = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 4);
  row[0] = 0;
  for (let x = 0; x < W; x++) {
    const i = 1 + x * 4;
    if (x === 1 && y === 1) {
      row[i] = INK_R; row[i + 1] = INK_G; row[i + 2] = INK_B; row[i + 3] = ALPHA;
    } else {
      row[i] = 0; row[i + 1] = 0; row[i + 2] = 0; row[i + 3] = 0;
    }
  }
  rows.push(row);
}
const raw = Buffer.concat(rows);
const idatData = zlib.deflateSync(raw);

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))]);

const out = path.join(__dirname, '..', 'assets', 'textures', 'paper-grain.png');
fs.writeFileSync(out, png);
console.log(`✓ wrote ${path.relative(path.join(__dirname, '..'), out)} (${W}×${H}, ${png.length} bytes)`);
