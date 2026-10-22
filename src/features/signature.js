// Hareket İmzası: kişinin hareket tarzından üretilen glif.
// Dış halka = günün hangi saatlerinde hareket ettiği (24 saatlik kadran),
// iç gül = hangi yönlere gittiği (16 dilim, mesafe ağırlıklı), merkez = baş harfler.
// Tek bir "puan" üretmez; yeteneği değil, tarzı gösterir.
import { store } from '../store.js';
import { METERS_PER_UNIT } from '../map/city.js';

const DIRS = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
const DIR_NAMES = { K: 'Kuzey', KD: 'Kuzeydoğu', D: 'Doğu', GD: 'Güneydoğu', G: 'Güney', GB: 'Güneybatı', B: 'Batı', KB: 'Kuzeybatı' };

export function signatureData(acts = store.myActivities()) {
  const hours = new Array(24).fill(0);
  const rose = new Array(16).fill(0);
  let loops = 0;
  for (const a of acts) {
    const d = new Date(a.date);
    hours[d.getHours()] += a.duration / 60;
    const pts = store.activityPts(a);
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
      const len = Math.hypot(dx, dy);
      if (!len) continue;
      const ang = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360; // kuzeyden saat yönü
      rose[Math.round(ang / 22.5) % 16] += len * METERS_PER_UNIT;
    }
    const s = pts[0], e = pts[pts.length - 1];
    if (Math.hypot(s[0] - e[0], s[1] - e[1]) < 25) loops++;
  }
  const peakHour = hours.indexOf(Math.max(...hours));
  // Ana yön: komşu dilimlerle yumuşatılmış en büyük dilim, 8 ana yöne indirgenmiş
  const smooth = rose.map((v, i) => v + 0.5 * (rose[(i + 15) % 16] + rose[(i + 1) % 16]));
  const top = smooth.indexOf(Math.max(...smooth));
  const main8 = DIRS[Math.round(top / 2) * 2 % 16];
  const part = peakHour < 5 ? 'Gece' : peakHour < 12 ? 'Sabah' : peakHour < 17 ? 'Öğleden Sonra' : peakHour < 21 ? 'Akşam' : 'Gece';
  return {
    hours, rose, count: acts.length,
    peak: `${part} · ${String(peakHour).padStart(2, '0')}–${String((peakHour + 2) % 24).padStart(2, '0')}`,
    heading: DIR_NAMES[main8] || main8,
    loopShare: acts.length ? Math.round((loops / acts.length) * 100) : 0,
  };
}

export function signatureSVG(data, initials = 'AY', { size = 260, accent = 'var(--accent)', animate = true } = {}) {
  const C = size / 2;
  const maxH = Math.max(1, ...data.hours), maxR = Math.max(1, ...data.rose);
  const R0 = size * 0.36, R1 = size * 0.47; // saat halkası
  const rad = (deg) => (deg - 90) * Math.PI / 180;
  const pt = (r, deg) => `${(C + r * Math.cos(rad(deg))).toFixed(1)} ${(C + r * Math.sin(rad(deg))).toFixed(1)}`;
  // 24 saatlik dilimler
  const hourArcs = data.hours.map((v, h) => {
    const a0 = h * 15 + 1.2, a1 = (h + 1) * 15 - 1.2;
    const t = v / maxH;
    const r1 = R0 + (R1 - R0) * (0.25 + 0.75 * t);
    return `<path d="M${pt(R0, a0)} A${R0} ${R0} 0 0 1 ${pt(R0, a1)} L${pt(r1, a1)} A${r1} ${r1} 0 0 0 ${pt(r1, a0)}Z" style="fill:${t ? accent : 'currentColor'};animation-delay:${h * 30}ms" fill-opacity="${t ? (0.25 + 0.75 * t).toFixed(2) : 0.07}" class="sig-h"><title>${String(h).padStart(2, '0')}:00 · ${Math.round(v)} dk</title></path>`;
  }).join('');
  const ticks = [0, 6, 12, 18].map((h) => `<text x="${pt(R1 + 10, h * 15).split(' ')[0]}" y="${pt(R1 + 10, h * 15).split(' ')[1]}" text-anchor="middle" dominant-baseline="middle" class="sig-t">${String(h).padStart(2, '0')}</text>`).join('');
  // Yön gülü
  const Rr = size * 0.31;
  const petals = data.rose.map((v, i) => {
    const deg = i * 22.5, t = Math.sqrt(v / maxR);
    const r = 10 + (Rr - 10) * t;
    return `<path d="M${C} ${C} L${pt(r, deg - 9)} A${r} ${r} 0 0 1 ${pt(r, deg + 9)}Z" style="fill:${accent};animation-delay:${300 + i * 35}ms" fill-opacity="${(0.15 + 0.6 * t).toFixed(2)}" stroke="#0b0c10" stroke-width="1" class="sig-p"/>`;
  }).join('');
  const comp = ['K', 'D', 'G', 'B'].map((l, i) => `<text x="${pt(Rr + 9, i * 90).split(' ')[0]}" y="${pt(Rr + 9, i * 90).split(' ')[1]}" text-anchor="middle" dominant-baseline="middle" class="sig-c">${l}</text>`).join('');
  return `<svg class="signature ${animate ? 'sig-anim' : ''}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hareket İmzası">
    <circle cx="${C}" cy="${C}" r="${R1 + 4}" fill="none" stroke="currentColor" stroke-opacity=".12"/>
    ${hourArcs}${ticks}
    <circle cx="${C}" cy="${C}" r="${Rr}" fill="none" stroke="currentColor" stroke-opacity=".1" stroke-dasharray="2 4"/>
    ${petals}${comp}
    <circle cx="${C}" cy="${C}" r="${size * 0.085}" fill="#0b0c10" style="stroke:${accent}" stroke-width="2"/>
    <text x="${C}" y="${C + 1}" text-anchor="middle" dominant-baseline="middle" class="sig-i">${initials}</text>
  </svg>`;
}

/** İmza posteri (kare PNG) ve paylaşım */
export async function shareSignature(data, initials, name) {
  const S = 1080;
  const inner = signatureSVG(data, initials, { size: 760, accent: '#c6f432', animate: false })
    .replace(/class="sig-t"/g, 'font-size="20" fill="#9a9ca6" font-family="system-ui, sans-serif"')
    .replace(/class="sig-c"/g, 'font-size="18" fill="#c6c7ce" font-family="system-ui, sans-serif"')
    .replace(/class="sig-i"/g, 'font-size="44" font-weight="800" fill="#ffffff" font-family="system-ui, sans-serif"')
    .replace('<svg ', '<svg x="160" y="150" color="#f3f4f6" ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <rect width="${S}" height="${S}" fill="#0b0c10"/>
    <text x="80" y="100" font-family="Georgia, serif" font-size="54" font-weight="700" fill="#f3f4f6">${name}</text>
    <text x="80" y="140" font-family="system-ui, sans-serif" font-size="24" letter-spacing="4" fill="#9a9ca6">HAREKET İMZASI · MOVECIRCLE</text>
    ${inner}
    <text x="80" y="1000" font-family="system-ui, sans-serif" font-size="28" fill="#c6f432">${data.peak} · ${data.heading} · %${data.loopShare} döngü</text>
  </svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    c.getContext('2d').drawImage(img, 0, 0);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    const file = new File([blob], 'hareket-imzasi.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] });
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); }
    return true;
  } finally { URL.revokeObjectURL(url); }
}
