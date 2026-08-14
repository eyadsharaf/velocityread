#!/usr/bin/env node
/**
 * Generate VelocityRead PWA icons — zero dependencies, pure Node.
 *
 * Renders a bold red "V" (single 6-point chevron polygon) on a dark
 * #121212 background, supersampled 4x4 per pixel for smooth edges,
 * encoded as fully opaque PNGs.
 *
 * Outputs (into public/icons/, committed to the repo):
 *   icon-192.png          — manifest, purpose "any"
 *   icon-512.png          — manifest, purpose "any"
 *   icon-maskable-512.png — manifest, purpose "maskable" (safe-zone padding)
 *   apple-touch-icon.png  — 180x180, referenced from index.html for iOS
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

// Palette (matches DESIGN.md / app theme)
const BG = [0x12, 0x12, 0x12]; // #121212 dark base
const FG = [0xff, 0x3b, 0x30]; // #FF3B30 iOS red

/* ---------------------------------- PNG ---------------------------------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: truecolor + alpha
  const raw = Buffer.alloc(height * (1 + width * 4));
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter: none
    rgba.copy(raw, p, y * width * 4, (y + 1) * width * 4);
    p += width * 4;
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* --------------------------------- Drawing -------------------------------- */

/** Even-odd rule point-in-polygon. */
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const SS = 4; // supersampling factor per axis (16 samples/pixel)

/**
 * Bold "V" as a 6-point chevron, in unit coords of the padded inner box:
 *   (l, t) ---- (l+w, t)             (r-w, t) ---- (r, t)
 *      \                                      /
 *       \          (cx, notchY)              /
 *        \                                  /
 *         \____________(cx, b)____________/
 */
const V_GEO = (() => {
  const left = 0.14, right = 0.86, top = 0.16, bottom = 0.84;
  const cx = 0.5;
  const wTop = 0.16; // horizontal stroke width at the top caps
  // Inner notch: intersection of the inner (offset) edges with x = cx
  const slope = (bottom - top) / (cx - (left + wTop));
  const notchY = top + (cx - (left + wTop)) * slope;
  return [
    [left, top],        // P1 top-left outer
    [cx, bottom],       // P2 bottom tip
    [right, top],       // P3 top-right outer
    [right - wTop, top],// P4 top-right inner
    [cx, notchY],       // P5 inner notch
    [left + wTop, top], // P6 top-left inner
  ];
})();

function drawV(size, padRatio) {
  const rgba = Buffer.alloc(size * size * 4);
  const pad = size * padRatio;
  const inner = size - 2 * pad;
  const poly = V_GEO.map(([fx, fy]) => [pad + fx * inner, pad + fy * inner]);

  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs)) - 1);
  const maxX = Math.min(size - 1, Math.ceil(Math.max(...xs)) + 1);
  const minY = Math.max(0, Math.floor(Math.min(...ys)) - 1);
  const maxY = Math.min(size - 1, Math.ceil(Math.max(...ys)) + 1);

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        const y = py + (sy + 0.5) / SS;
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          if (pointInPoly(x, y, poly)) hits++;
        }
      }
      const a = hits / (SS * SS);
      const i = (py * size + px) * 4;
      rgba[i] = Math.round(BG[0] + (FG[0] - BG[0]) * a);
      rgba[i + 1] = Math.round(BG[1] + (FG[1] - BG[1]) * a);
      rgba[i + 2] = Math.round(BG[2] + (FG[2] - BG[2]) * a);
      rgba[i + 3] = 255; // fully opaque
    }
  }

  // Fill any untouched pixels with the background (alloc initializes to 0)
  for (let i = 3; i < size * size * 4; i += 4) rgba[i] = 255;
  for (let i = 0; i < size * size * 4; i += 4) {
    if (rgba[i] === 0 && rgba[i + 1] === 0 && rgba[i + 2] === 0) {
      rgba[i] = BG[0];
      rgba[i + 1] = BG[1];
      rgba[i + 2] = BG[2];
    }
  }
  return rgba;
}

/* ---------------------------------- Main ---------------------------------- */

const TARGETS = [
  { file: 'icon-192.png', size: 192, pad: 0.0 },
  { file: 'icon-512.png', size: 512, pad: 0.0 },
  { file: 'icon-maskable-512.png', size: 512, pad: 0.2 }, // 20% safe zone
  { file: 'apple-touch-icon.png', size: 180, pad: 0.0 },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const { file, size, pad } of TARGETS) {
  const png = encodePng(size, size, drawV(size, pad));
  writeFileSync(join(OUT_DIR, file), png);
  console.log(`ok ${file} (${size}x${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
console.log(`Icons written to ${OUT_DIR}`);