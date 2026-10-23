// Rota Karakter Kartı: rotayı mesafeden önce karakteriyle tanıtır (dönüş, yeşil, su, eğim).
// Tamamen yerel: rota geometrisi + OpenStreetMap parkları, kıyı çizgisi ve DEM yüksekliği.
import { greenAt as inGreen, coastDistance, elevation, METERS_PER_UNIT } from '../map/city.js';

export const TRAITS = [
  { key: 'turns', label: 'Dönüş', icon: '<path d="M4 18 8 8l4 8 4-8 4 10"/>' },
  { key: 'green', label: 'Yeşil', icon: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14Z"/><path d="M5 19 13 11"/>' },
  { key: 'water', label: 'Su', icon: '<path d="M3 10c3-2 6 2 9 0s6-2 9 0M3 15c3-2 6 2 9 0s6-2 9 0"/>' },
  { key: 'slope', label: 'Eğim', icon: '<path d="m3 19 6-10 4 6 2.5-3.5L21 19H3Z"/>' },
];

export const MOODS = [
  { key: 'all', label: 'Hepsi', score: () => 0 },
  { key: 'calm', label: 'Sakinleşmek', score: (c) => c.green.v * 1.2 + c.water.v * 1.4 - c.turns.v - c.slope.v * 0.6 },
  { key: 'energy', label: 'Enerji', score: (c) => c.slope.v * 1.5 + c.turns.v * 0.6 },
  { key: 'explore', label: 'Keşif', score: (c) => c.turns.v * 1.3 + c.green.v * 0.4 },
];

const greenAt = ([x, y]) => inGreen(x, y);
const waterAt = ([x, y]) => coastDistance(x, y) < 250;

const level = (v, [a, b, c]) => (v >= c ? 3 : v >= b ? 2 : v >= a ? 1 : 0);
const cache = new Map();

/** Bir rotanın karakteri. v: 0..1 arası ham değer, lvl: 0..3, mask: hangi noktaların katkı verdiği. */
export function routeCharacter(route) {
  if (cache.has(route.id)) return cache.get(route.id);
  const pts = route.pts;
  const kmTotal = route.distance / 1000 || 1;
  // Dönüş: 30°'den büyük yön değişimlerinin km başına sayısı
  const turnMask = new Array(pts.length).fill(false);
  let turns = 0, prev = null;
  for (let i = 4; i < pts.length; i += 4) {
    const h = Math.atan2(pts[i][1] - pts[i - 4][1], pts[i][0] - pts[i - 4][0]);
    if (prev !== null) {
      let dh = Math.abs(h - prev);
      if (dh > Math.PI) dh = 2 * Math.PI - dh;
      if (dh > Math.PI / 6) { turns++; for (let k = i - 4; k <= i; k++) turnMask[k] = true; }
    }
    prev = h;
  }
  const greenMask = pts.map(greenAt);
  const waterMask = pts.map(waterAt);
  const slopeMask = pts.map((p, i) => i > 0 && elevation(...p) - elevation(...pts[i - 1]) > 0.4);
  const frac = (m) => m.filter(Boolean).length / pts.length;
  const turnRate = turns / kmTotal; // dönüş / km
  const gainPerKm = route.gain / kmTotal;
  const c = {
    turns: { v: Math.min(1, turnRate / 8), lvl: level(turnRate, [1, 3, 6]), mask: turnMask, text: `${turnRate.toFixed(1)} dönüş/km` },
    green: { v: frac(greenMask), lvl: level(frac(greenMask), [0.08, 0.3, 0.6]), mask: greenMask, text: `%${Math.round(frac(greenMask) * 100)} yeşil` },
    water: { v: frac(waterMask), lvl: level(frac(waterMask), [0.08, 0.35, 0.7]), mask: waterMask, text: `%${Math.round(frac(waterMask) * 100)} kıyıda` },
    slope: { v: Math.min(1, gainPerKm / 40), lvl: level(gainPerKm, [5, 15, 30]), mask: slopeMask, text: `${Math.round(gainPerKm)} m/km tırmanış` },
  };
  cache.set(route.id, c);
  return c;
}

export function traitGlyph(t, lvl, size = 22) {
  return `<span class="trait lvl${lvl}" title="${t.label}">
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
    <i class="bars"><b></b><b></b><b></b></i></span>`;
}

/** Bir maskeye göre ardışık nokta gruplarını döndürür (haritada vurgulamak için). */
export function maskRuns(pts, mask) {
  const runs = [];
  let cur = [];
  pts.forEach((p, i) => {
    if (mask[i]) cur.push(p);
    else if (cur.length) { if (cur.length > 1) runs.push(cur); cur = []; }
  });
  if (cur.length > 1) runs.push(cur);
  return runs;
}

/** Yükselti silueti: rota boyunca irtifa, şehir siluetine benzeyen katmanlı SVG. */
export function silhouetteSVG(pts, { w = 340, h = 90 } = {}) {
  const step = Math.max(1, Math.floor(pts.length / 120));
  const s = pts.filter((_, i) => i % step === 0).map((p) => elevation(...p));
  const max = Math.max(...s) + 6, min = Math.max(0, Math.min(...s) - 4);
  const xy = (k, off = 0) => s.map((v, i) => `${((i / (s.length - 1)) * w).toFixed(1)},${(h - ((v - min) / (max - min || 1)) * (h - 18) * k - off).toFixed(1)}`).join(' L');
  const peak = s.indexOf(Math.max(...s));
  const px = (peak / (s.length - 1)) * w, py = h - ((s[peak] - min) / (max - min || 1)) * (h - 18);
  return `<svg class="silhouette" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <path d="M0,${h} L${xy(0.55, -6)} L${w},${h}Z" fill="currentColor" opacity=".12"/>
    <path d="M0,${h} L${xy(0.8, -3)} L${w},${h}Z" fill="currentColor" opacity=".22"/>
    <path d="M0,${h} L${xy(1)} L${w},${h}Z" fill="currentColor" opacity=".55"/>
    <line x1="${px}" x2="${px}" y1="${py}" y2="${py - 14}" stroke="currentColor" stroke-width="1.5"/>
    <path d="M${px} ${py - 14} l9 3 -9 3Z" fill="currentColor"/>
  </svg><small class="muted">${min}–${max} m · en yüksek nokta ${Math.round(Math.max(...s))} m</small>`;
}

export const metersOf = (units) => units * METERS_PER_UNIT;
