/* ------------------------------------------------------------------
   Generates the placeholder gallery artwork in assets/gallery/.
   Run once with:   node tools/make-placeholders.mjs
   Delete this file (and the SVGs) once you've added your real photos.
   ------------------------------------------------------------------ */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'assets/gallery');
mkdirSync(out, { recursive: true });

/* deterministic pseudo-random so re-runs produce identical files */
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const F = (n) => Number(n).toFixed(1);

/* [name, w, h, skyTop, skyBottom, far, mid, near, accent] */
const SCENES = [
  ['photo-01', 1100, 2100, '#c3d0ad', '#eee6d2', '#8d9c72', '#68794a', '#3f4c2c', '#5c2230'],
  ['photo-02', 1200, 1500, '#d4dcc6', '#f4eee0', '#9aa77f', '#71804f', '#43502f', '#6b4a34'],
  ['photo-03', 1200, 1500, '#e2d9c2', '#f7f2e8', '#a3ab84', '#7c8a5a', '#4d5c38', '#8c4250'],
  ['photo-04', 1800, 1125, '#bccaa6', '#ece4d0', '#879670', '#5f7042', '#38452a', '#a98b52'],
  ['photo-05', 1200, 1500, '#ecdfc8', '#dfe6d2', '#a8b189', '#7c8a5a', '#465231', '#73303c'],
  // the two --tall items span 2 grid rows → roughly 1:2 portrait
  ['photo-06', 1100, 2100, '#cbd8b8', '#f2ecdc', '#909e77', '#657545', '#3d4a2c', '#5c2230'],
  ['photo-07', 1200, 1500, '#d8e0cc', '#fbf8f1', '#9fad85', '#778654', '#414e2f', '#61713f'],
  ['photo-08', 1200, 1500, '#e8dcc4', '#f1e9da', '#9ba77e', '#6c7b4c', '#3c4929', '#8c4250'],
];

/** soft rolling hill silhouette across the full width */
function hill(w, h, baseY, amp, rand) {
  const steps = 8;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    pts.push([(w / steps) * i, baseY + Math.sin(i * 1.15 + rand() * 3) * amp - rand() * amp * 0.6]);
  }
  let d = `M0,${F(h)} L0,${F(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const mx = px + (x - px) / 2;
    d += ` C${F(mx)},${F(py)} ${F(mx)},${F(y)} ${F(x)},${F(y)}`;
  }
  return `${d} L${F(w)},${F(h)} Z`;
}

/** a painterly tree: trunk, a few branches, clustered canopy blobs */
function tree(x, y, s, colour, rand) {
  let g = `<g><path d="M${F(x)},${F(y)} C${F(x - 3 * s)},${F(y - 24 * s)} ${F(x + 4 * s)},${F(y - 34 * s)} ${F(x - s)},${F(y - 58 * s)}" fill="none" stroke="${colour}" stroke-width="${F(2.6 * s)}" stroke-linecap="round" opacity=".9"/>`;
  for (let i = 0; i < 3; i++) {
    const by = y - (26 + i * 12) * s;
    const dir = i % 2 ? 1 : -1;
    g += `<path d="M${F(x)},${F(by)} q${F(dir * 12 * s)},${F(-6 * s)} ${F(dir * 20 * s)},${F(-14 * s)}" fill="none" stroke="${colour}" stroke-width="${F(1.4 * s)}" stroke-linecap="round" opacity=".7"/>`;
  }
  for (let i = 0; i < 16; i++) {
    const cx = x + (rand() - 0.5) * 46 * s;
    const cy = y - 40 * s - rand() * 32 * s;
    const r = (9 + rand() * 15) * s;
    g += `<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(r)}" fill="${colour}" opacity="${(0.3 + rand() * 0.45).toFixed(2)}"/>`;
  }
  return `${g}</g>`;
}

for (const [name, w, h, skyA, skyB, far, mid, near, accent] of SCENES) {
  const rand = rng(parseInt(name.split('-')[1], 10) * 7919 + w);
  const horizon = h * (0.5 + rand() * 0.1);
  const k = w / 640;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Placeholder landscape">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${skyA}"/><stop offset=".62" stop-color="${skyB}"/><stop offset="1" stop-color="${skyB}"/>
  </linearGradient>
  <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${skyB}" stop-opacity=".85"/><stop offset="1" stop-color="${skyB}" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="sun" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#fff8e6" stop-opacity=".85"/><stop offset="1" stop-color="#fff8e6" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx=".5" cy=".45" r=".78">
    <stop offset=".55" stop-color="#2f3823" stop-opacity="0"/><stop offset="1" stop-color="#2f3823" stop-opacity=".3"/>
  </radialGradient>
  <filter id="blurFar"><feGaussianBlur stdDeviation="${F(w / 150)}"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>`;

  // low sun glow
  const sunX = w * (0.2 + rand() * 0.6);
  svg += `<circle cx="${F(sunX)}" cy="${F(horizon - h * 0.12)}" r="${F(w * 0.34)}" fill="url(#sun)"/>`;

  // distant misty ridges
  svg += `<g filter="url(#blurFar)">
    <path d="${hill(w, h, horizon - h * 0.075, h * 0.045, rand)}" fill="${far}" opacity=".55"/>
    <path d="${hill(w, h, horizon - h * 0.03, h * 0.038, rand)}" fill="${far}" opacity=".7"/>
  </g>`;

  // mist band along the horizon
  svg += `<rect x="0" y="${F(horizon - h * 0.1)}" width="${w}" height="${F(h * 0.15)}" fill="url(#mist)"/>`;

  // mid ground
  svg += `<path d="${hill(w, h, horizon + h * 0.04, h * 0.032, rand)}" fill="${mid}" opacity=".9"/>`;

  // hazy mid-ground tree line
  for (let i = 0; i < 7; i++) {
    const tx = w * (0.02 + rand() * 0.96);
    const ty = horizon + h * (0.05 + rand() * 0.05);
    svg += `<g opacity=".45">${tree(tx, ty, k * (0.32 + rand() * 0.22), near, rand)}</g>`;
  }

  // near ground
  svg += `<path d="${hill(w, h, horizon + h * 0.17, h * 0.028, rand)}" fill="${near}" opacity=".95"/>`;

  // foreground trees — the focal silhouettes
  const nTrees = 3 + Math.floor(rand() * 2);
  for (let i = 0; i < nTrees; i++) {
    const tx = w * (0.06 + (i / nTrees) * 0.9 + (rand() - 0.5) * 0.12);
    const ty = horizon + h * (0.2 + rand() * 0.16);
    svg += tree(tx, ty, k * (0.95 + rand() * 0.85), i === 1 ? accent : near, rand);
  }

  // scattered accent foliage
  for (let i = 0; i < 9; i++) {
    const bx = rand() * w;
    const by = horizon + h * (0.22 + rand() * 0.26);
    const rx = 20 * k * (0.6 + rand() * 0.9);
    svg += `<ellipse cx="${F(bx)}" cy="${F(by)}" rx="${F(rx)}" ry="${F(rx * 0.38)}" transform="rotate(${F(rand() * 100 - 50)} ${F(bx)} ${F(by)})" fill="${accent}" opacity="${(0.3 + rand() * 0.3).toFixed(2)}"/>`;
  }

  // finishing: grain, vignette, inner border, label
  svg += `<rect width="${w}" height="${h}" filter="url(#grain)" opacity=".09"/>`;
  svg += `<rect width="${w}" height="${h}" fill="url(#vig)"/>`;
  svg += `<rect x="${F(w * 0.012)}" y="${F(w * 0.012)}" width="${F(w - w * 0.024)}" height="${F(h - w * 0.024)}" fill="none" stroke="#f7f2e8" stroke-opacity=".5" stroke-width="${F(w / 260)}"/>`;

  const labelY = h - h * 0.05;
  svg += `<g opacity=".62">
    <rect x="${F(w * 0.5 - w * 0.24)}" y="${F(labelY - w / 26)}" width="${F(w * 0.48)}" height="${F(w / 17)}" fill="#2f3823" fill-opacity=".42"/>
    <text x="${F(w * 0.5)}" y="${F(labelY)}" text-anchor="middle" dominant-baseline="middle"
          font-family="Georgia, 'Times New Roman', serif" font-size="${F(w / 32)}"
          letter-spacing="${F(w / 190)}" fill="#f7f2e8">YOUR PHOTO HERE</text>
  </g>`;

  svg += `</svg>`;

  writeFileSync(resolve(out, `${name}.svg`), svg);
  console.log('wrote', `assets/gallery/${name}.svg`, `${w}×${h}`);
}
