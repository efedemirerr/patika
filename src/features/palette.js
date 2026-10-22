// Hava Paleti: vurgu rengi ve zemin tonu güneşin yüksekliğine göre altı ön ayar arasında kayar.
// Ağ yok: güneş konumu enlem/boylam ve saatten hesaplanır.
import { store } from '../store.js';

// Varsayılan konum: Ege kıyısı (kurgusal Liman Şehri için temsili)
const LAT = 38.4, LON = 27.1;

export const PRESETS = {
  night: { label: 'Gece', accent: '#b9a7ff', bg: '#08090f' },
  dawn: { label: 'Şafak', accent: '#ffb3c7', bg: '#100c12' },
  morning: { label: 'Sabah', accent: '#9be7ff', bg: '#0a0e12' },
  noon: { label: 'Öğle', accent: '#c6f432', bg: '#0c0d10' },
  afternoon: { label: 'İkindi', accent: '#ffd166', bg: '#100f0b' },
  sunset: { label: 'Gün batımı', accent: '#ffa95e', bg: '#120d0a' },
};

/** Güneşin ufka göre yüksekliği (derece), NOAA yaklaşık formülü. */
export function sunElevation(date = new Date(), lat = LAT, lon = LON) {
  const rad = Math.PI / 180;
  const day = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const g = ((2 * Math.PI) / 365) * (day - 1 + (hours - 12) / 24);
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const tst = hours * 60 + eqt + 4 * lon; // gerçek güneş zamanı (dk)
  const ha = (tst / 4 - 180) * rad;
  const cosZ = Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(ha);
  return 90 - Math.acos(Math.min(1, Math.max(-1, cosZ))) / rad;
}

export function presetFor(date = new Date()) {
  const el = sunElevation(date);
  const morning = date.getHours() < 13;
  if (el < -6) return 'night';
  if (el < 6) return morning ? 'dawn' : 'sunset';
  if (el < 30) return morning ? 'morning' : 'afternoon';
  return 'noon';
}

let frozen = false;
export const freezePalette = (v) => { frozen = v; if (!v) applyPalette(); };

export function applyPalette(date = new Date()) {
  if (frozen) return;
  const on = store.get().palette !== false;
  const p = PRESETS[on ? presetFor(date) : 'noon'];
  const r = document.documentElement.style;
  r.setProperty('--accent', p.accent);
  r.setProperty('--bg', p.bg);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.bg);
}

export function startPalette() {
  applyPalette();
  setInterval(applyPalette, 10 * 60 * 1000);
}

/** 24 saatlik önizleme bandı (ayarlar ekranı için). */
export function paletteBand() {
  const now = new Date();
  const stops = [];
  for (let h = 0; h <= 24; h++) {
    const d = new Date(now); d.setHours(h, 0, 0, 0);
    stops.push(`${PRESETS[presetFor(d)].accent} ${((h / 24) * 100).toFixed(1)}%`);
  }
  const pos = ((now.getHours() + now.getMinutes() / 60) / 24) * 100;
  return `<div class="pal-band" style="background:linear-gradient(90deg, ${stops.join(',')})"><i style="left:${pos}%"></i></div>
    <div class="pal-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
    <p class="muted small">Şu an: ${PRESETS[presetFor(now)].label}. Kayıt sırasında renkler sabit kalır.</p>`;
}
