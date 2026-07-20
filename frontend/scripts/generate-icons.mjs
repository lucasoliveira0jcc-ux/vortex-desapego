// Gerador de ícones do PWA — sem nenhuma dependência externa.
// Desenha um "leaf" (folha da economia circular) sobre um fundo verde em
// degradê e codifica tudo como PNG na mão (usando apenas zlib nativo).
// Roda com: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'icons');
mkdirSync(outDir, { recursive: true });

// ---------- Tabela de CRC32 (necessária para os chunks do PNG) ----------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  // Adiciona o byte de filtro (0 = None) no início de cada scanline.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Desenho ----------
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

// Cor de um pixel (coordenadas normalizadas 0..1). Retorna [r,g,b,a].
function pixel(nx, ny) {
  // Fundo: degradê diagonal verde -> teal
  const t = (nx + ny) / 2;
  const bg = [
    Math.round(lerp(34, 13, t)),   // r
    Math.round(lerp(197, 148, t)), // g
    Math.round(lerp(94, 136, t)),  // b
  ];

  // Folha = interseção (lente) de dois círculos.
  const R = 0.46;
  const c1 = [0.33, 0.67];
  const c2 = [0.67, 0.33];
  const insideLeaf = dist(nx, ny, c1[0], c1[1]) < R && dist(nx, ny, c2[0], c2[1]) < R;

  if (insideLeaf) {
    // Nervura central ao longo do eixo maior (linha nx == ny).
    const vein = Math.abs(nx - ny) < 0.022;
    if (vein) return [...bg, 255]; // nervura na cor do fundo, "cortando" a folha
    // Leve degradê dentro da folha para dar volume.
    const shade = Math.round(lerp(255, 226, (nx + ny) / 2));
    return [shade, 255, Math.min(255, shade + 20), 255];
  }
  return [...bg, 255];
}

// Renderiza com supersampling (SS x SS) para bordas suaves.
function render(size, SS = 3) {
  const big = size * SS;
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const nx = (x * SS + sx + 0.5) / big;
          const ny = (y * SS + sy + 0.5) / big;
          const p = pixel(nx, ny);
          r += p[0]; g += p[1]; b += p[2]; a += p[3];
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(g / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = Math.round(a / n);
    }
  }
  return encodePNG(size, size, rgba);
}

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
  ['favicon-32.png', 32],
  ['favicon-16.png', 16],
];

for (const [name, size] of targets) {
  writeFileSync(join(outDir, name), render(size));
  console.log(`✓ ${name} (${size}x${size})`);
}
console.log('Ícones gerados em frontend/icons/');
