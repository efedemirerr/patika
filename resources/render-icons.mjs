// Simgeleri ve açılış ekranlarını PNG olarak üretir (Chromium ile, keskin kenarlı).
// Kullanım: node resources/render-icons.mjs && python3 resources/render-icons.py
import fs from 'fs';
import path from 'path';
import { square, round, foreground, background, full } from './icon.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RES = path.join(ROOT, 'android/app/src/main/res');
const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const splash = (w, h) => {
  const s = Math.min(w, h) * 0.34;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0b0c10"/>
    <svg x="${(w - s) / 2}" y="${(h - s) / 2 - s * 0.12}" width="${s}" height="${s}" viewBox="0 0 100 100">${foreground(100).replace(/^<svg[^>]*>|<\/svg>$/g, '').replace('scale(0.66)', 'scale(1)')}</svg>
    <text x="${w / 2}" y="${(h + s) / 2 + s * 0.12}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${s * 0.2}" fill="#f3f4f6" letter-spacing="${s * 0.004}">MoveCircle</text>
  </svg>`;
};

const jobs = [];
for (const [d, k] of Object.entries(DENS)) {
  const dir = path.join(RES, `mipmap-${d}`);
  jobs.push([path.join(dir, 'ic_launcher.png'), square(48 * k, 22), 48 * k, 48 * k]);
  jobs.push([path.join(dir, 'ic_launcher_round.png'), round(48 * k), 48 * k, 48 * k]);
  jobs.push([path.join(dir, 'ic_launcher_foreground.png'), foreground(108 * k), 108 * k, 108 * k]);
  jobs.push([path.join(dir, 'ic_launcher_background.png'), background(108 * k), 108 * k, 108 * k]);
}
const SPLASH = {
  'drawable': [480, 320], 'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720], 'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280],
  'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280], 'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
};
for (const [dir, [w, h]] of Object.entries(SPLASH)) jobs.push([path.join(RES, dir, 'splash.png'), splash(w, h), w, h]);

const PUB = path.join(ROOT, 'public');
jobs.push([path.join(PUB, 'icon-192.png'), square(192, 22), 192, 192]);
jobs.push([path.join(PUB, 'icon-512.png'), square(512, 22), 512, 512]);
jobs.push([path.join(PUB, 'icon-maskable-512.png'), full(512), 512, 512]);
jobs.push([path.join(PUB, 'apple-touch-icon.png'), full(180), 180, 180]);
jobs.push([path.join(PUB, 'favicon-32.png'), square(32, 22), 32, 32]);
jobs.push([path.join(ROOT, 'resources', 'icon-1024.png'), full(1024), 1024, 1024]);

fs.writeFileSync(path.join(PUB, 'icon.svg'), square(512, 22));
fs.writeFileSync(path.join(ROOT, 'resources', 'icon.svg'), full(1024));

// PNG'ye çevirme işi Python Playwright ile yapılır: python3 resources/render-icons.py
fs.writeFileSync(path.join(ROOT, 'resources', '.icon-jobs.json'), JSON.stringify(jobs));
console.log(`${jobs.length} iş hazır`);
