/**
 * Generates every app image from one source: the Brote mascot, drawn as SVG.
 *
 *   node scripts/generate-icons.mjs
 *
 * Outputs (assets/images/): app icon, Android adaptive foreground + monochrome,
 * splash icon and favicon. Re-run after changing brand colors.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');

// Brand colors (keep in sync with src/constants/theme.ts)
const CREAM = '#FFF8F1';
const GREEN_LIGHT = '#5FD69A';
const GREEN = '#3DBE7A';
const GREEN_DEEP = '#2A9A63';
const INK = '#23384A';
const CHEEK = '#FF9FB0';

/**
 * Brote in a 120×120 box, matching src/features/mascot/brote.tsx.
 * `solid` renders a flat silhouette for the Android monochrome icon.
 */
function brote({ leafA, leafB, body, bodyLight, ink, cheek, solid = false }) {
  if (solid) {
    return `
      <path d="M60 48 C42 50 30 40 30 26 C46 22 58 32 60 48 Z" fill="${leafA}"/>
      <path d="M60 48 C78 50 90 40 90 26 C74 22 62 32 60 48 Z" fill="${leafA}"/>
      <path d="M57 64 L57 42 Q60 36 63 42 L63 64 Z" fill="${leafA}"/>
      <ellipse cx="60" cy="82" rx="30" ry="28" fill="${leafA}"/>`;
  }
  return `
    <path d="M60 48 C42 50 30 40 30 26 C46 22 58 32 60 48 Z" fill="${leafA}"/>
    <path d="M60 48 C78 50 90 40 90 26 C74 22 62 32 60 48 Z" fill="${leafB}"/>
    <path d="M58 64 L58 42 Q60 38 62 42 L62 64 Z" fill="${leafA}"/>
    <ellipse cx="60" cy="82" rx="30" ry="28" fill="${body}"/>
    <ellipse cx="60" cy="86" rx="24" ry="21" fill="${bodyLight}" opacity="0.6"/>
    <circle cx="51" cy="78" r="4.2" fill="${ink}"/>
    <circle cx="69" cy="78" r="4.2" fill="${ink}"/>
    <circle cx="52.6" cy="76.4" r="1.5" fill="#FFFFFF"/>
    <circle cx="70.6" cy="76.4" r="1.5" fill="#FFFFFF"/>
    <circle cx="42" cy="86" r="5" fill="${cheek}" opacity="0.7"/>
    <circle cx="78" cy="86" r="5" fill="${cheek}" opacity="0.7"/>
    <path d="M53 88 q7 7 14 0" stroke="${ink}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
}

/** Wraps Brote in a square canvas, scaled and centered. */
function canvas({ size, background = null, scale, palette, offsetY = 0 }) {
  const tx = size / 2 - 60 * scale;
  const ty = size / 2 - 62 * scale + offsetY;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${background ?? ''}
  <g transform="translate(${tx} ${ty}) scale(${scale})">${brote(palette)}</g>
</svg>`;
}

const greenBackground = (size) => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GREEN_LIGHT}"/>
      <stop offset="1" stop-color="${GREEN_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>`;

/** Cream mascot on green: readable down to 40px. */
const onGreen = { leafA: CREAM, leafB: '#EAFBF1', body: CREAM, bodyLight: '#FFFFFF', ink: INK, cheek: CHEEK };
const onCream = { leafA: GREEN, leafB: GREEN_LIGHT, body: GREEN_LIGHT, bodyLight: '#8FE8BE', ink: INK, cheek: CHEEK };

const files = [
  // iOS / default app icon: full-bleed square, no transparency.
  { name: 'icon.png', svg: canvas({ size: 1024, background: greenBackground(1024), scale: 6.9, palette: onGreen }) },
  // Android adaptive: only the centered ~66% is always visible, so keep it small.
  { name: 'android-icon-foreground.png', svg: canvas({ size: 1024, scale: 4.1, palette: onGreen }) },
  { name: 'android-icon-monochrome.png', svg: canvas({ size: 1024, scale: 4.1, palette: { leafA: '#FFFFFF', solid: true } }) },
  // Splash and web.
  { name: 'splash-icon.png', svg: canvas({ size: 512, scale: 3.6, palette: onCream }) },
  { name: 'favicon.png', svg: canvas({ size: 96, background: greenBackground(96), scale: 0.65, palette: onGreen }) },
];

for (const { name, svg } of files) {
  const png = new Resvg(svg, { background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(path.join(out, name), png);
  console.log(`✓ ${name} (${(png.length / 1024).toFixed(0)} KB)`);
}
