// Rota Mührü: rota geometrisi + km bölümlerinden üretilen, aynı girdiye hep aynı çıktıyı veren SVG.
import { METERS_PER_UNIT } from '../map/city.js';
import { pace } from '../util.js';

export const INK = { paper: '#F4EFE6', ink: '#1E2430', red: '#D2492A', faint: '#C9C0AE' };

/** Her tam km (ve varsa son kısmi km) için saniye cinsinden süre; aktivite başına deterministik. */
export function splitTimes(a) {
  const full = Math.floor(a.distance / 1000);
  const rest = a.distance - full * 1000;
  const avg = a.duration / (a.distance / 1000);
  const raw = [];
  for (let i = 0; i < full; i++) raw.push(avg * (0.94 + 0.12 * Math.abs(Math.sin(i * 1.7 + a.distance))));
  if (rest > 50) raw.push(avg * (rest / 1000));
  // Toplam süreyle tutarlı olacak şekilde ölçekle
  const sum = raw.reduce((s, t) => s + t, 0) || 1;
  return raw.map((t, i) => ({ km: i + 1, sec: (t * a.duration) / sum, meters: i < full ? 1000 : rest }));
}

/** Bölüm başına tempo (sn/km) */
export const splitPaces = (a) => splitTimes(a).map((s) => s.sec / (s.meters / 1000));

function bearing(pts) {
  const a = pts[0], b = pts[Math.min(pts.length - 1, 8)];
  return Math.atan2(b[0] - a[0], b[1] - a[1]); // kuzeye göre
}

/**
 * Mühür SVG'si. pts: harita birimi [x,y]; a: aktivite (distance, duration).
 * opts.animate: çizim animasyonu sınıfları eklenir.
 */
export function sealSVG(a, pts, { size = 320, animate = false, ink = INK.ink, red = INK.red, paper = INK.paper, bg = true } = {}) {
  const C = size / 2, R = size * 0.44, inner = R * 0.66;
  // normalize: ağırlık merkezine taşı, başlangıç yönüyle döndür, iç daireye sığdır
  let cx = 0, cy = 0;
  for (const [x, y] of pts) { cx += x; cy += y; }
  cx /= pts.length; cy /= pts.length;
  const rot = -bearing(pts);
  const rp = pts.map(([x, y]) => {
    const dx = x - cx, dy = y - cy;
    return [dx * Math.cos(rot) - dy * Math.sin(rot), dx * Math.sin(rot) + dy * Math.cos(rot)];
  });
  const ext = Math.max(...rp.map(([x, y]) => Math.hypot(x, y))) || 1;
  const k = (inner * 0.92) / ext;
  const step = Math.max(1, Math.floor(rp.length / 400));
  const d = 'M' + rp.filter((_, i) => i % step === 0 || i === rp.length - 1).map(([x, y]) => `${(C + x * k).toFixed(1)} ${(C - y * k).toFixed(1)}`).join('L');

  const paces = splitPaces(a);
  const n = Math.max(1, paces.length);
  const fastest = Math.min(...paces), slowest = Math.max(...paces);
  const gap = n > 1 ? Math.min(6, 120 / n) : 0;
  const rings = paces.map((p, i) => {
    const t = slowest === fastest ? 0.5 : (slowest - p) / (slowest - fastest); // 1 = hızlı
    const w = 3 + t * 9;
    const a0 = (i / n) * 360 + gap / 2 - 90, a1 = ((i + 1) / n) * 360 - gap / 2 - 90;
    const rad = (deg) => (deg * Math.PI) / 180;
    const p0 = [C + R * Math.cos(rad(a0)), C + R * Math.sin(rad(a0))];
    const p1 = [C + R * Math.cos(rad(a1)), C + R * Math.sin(rad(a1))];
    const large = a1 - a0 > 180 ? 1 : 0;
    const color = p === fastest && n > 1 ? red : ink;
    const arc = n === 1
      ? `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${color}" stroke-width="${w.toFixed(1)}"/>`
      : `<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${R} ${R} 0 ${large} 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}" fill="none" stroke="${color}" stroke-width="${w.toFixed(1)}" stroke-linecap="round"${animate ? ` class="seal-ring" style="animation-delay:${1.2 + i * 0.06}s"` : ''}><title>${i + 1}. km · ${pace(p, 1000)} /km</title></path>`;
    return arc;
  }).join('');

  const tick = Array.from({ length: 72 }, (_, i) => {
    const ang = (i / 72) * Math.PI * 2;
    const r0 = R + 12, r1 = R + (i % 6 === 0 ? 20 : 15);
    return `<line x1="${(C + r0 * Math.cos(ang)).toFixed(1)}" y1="${(C + r0 * Math.sin(ang)).toFixed(1)}" x2="${(C + r1 * Math.cos(ang)).toFixed(1)}" y2="${(C + r1 * Math.sin(ang)).toFixed(1)}" stroke="${ink}" stroke-width="1" opacity=".5"/>`;
  }).join('');

  const s = pts[0], e = pts[pts.length - 1];
  const tp = ([x, y]) => { const dx = x - cx, dy = y - cy; return [C + (dx * Math.cos(rot) - dy * Math.sin(rot)) * k, C - (dx * Math.sin(rot) + dy * Math.cos(rot)) * k]; };
  const [sx, sy] = tp(s), [ex, ey] = tp(e);

  return `<svg class="seal ${animate ? 'seal-anim' : ''}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rota mührü">
    ${bg ? `<rect width="${size}" height="${size}" fill="${paper}"/>` : ''}
    <g class="seal-body">
      ${tick}
      <circle cx="${C}" cy="${C}" r="${inner}" fill="none" stroke="${ink}" stroke-width="1" opacity=".35"/>
      ${rings}
      <path d="${d}" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" pathLength="1" ${animate ? 'class="seal-line"' : ''}/>
      <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="4" fill="${paper}" stroke="${ink}" stroke-width="2"/>
      <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3.5" fill="${ink}"/>
    </g>
  </svg>`;
}

export const distanceKm = (pts) => {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return (d * METERS_PER_UNIT) / 1000;
};
