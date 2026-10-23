import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Capacitor } from '@capacitor/core';
import { CITY, SIZE, BBOX, toLatLng, fromLatLng, MAP_SOURCE } from './city.js';

const ll = (p) => toLatLng(p); // yerel [x,y] -> [lat,lng]
const lls = (pts) => pts.map(ll);
const xy = (latlng) => fromLatLng(latlng.lat, latlng.lng);
// Eski düz (CRS.Simple) yakınlaştırma değerlerini gerçek Web Mercator yakınlaştırmasına çevirir (1 birim = 12 m, enlem ~41°).
const ZOFF = Math.log2((156543.03 * Math.cos((41 * Math.PI) / 180)) / 12);
const z = (simpleZoom) => simpleZoom + ZOFF;

export const THEMES = {
  dark: { sea: '#0e2537', land: '#1b1d26', park: '#1f4a35', minor: '#2f3447', major: '#5a6390', highway: '#8a8fa0' },
  light: { sea: '#a9d2ec', land: '#f1efe9', park: '#c4e3b5', minor: '#dcd8cf', major: '#ffffff', highway: '#f2c66d' },
};

// ---------- Çevrimdışı PMTiles altlığı ----------
const PM_URL = 'maps/kadikoy.pmtiles';
let pmPromise = null;
/** Harita dosyası varsa PMTiles örneğini döndürür. Web'de HTTP aralık istekleriyle okunur,
 *  Android'de (Capacitor) dosya bir kez belleğe alınıp oradan okunur. Yoksa null → vektör yedek çizim. */
function loadPmtiles() {
  if (pmPromise) return pmPromise;
  pmPromise = (async () => {
    try {
      let src = PM_URL;
      if (Capacitor.isNativePlatform()) {
        const r = await fetch(PM_URL);
        if (!r.ok) return null;
        const buf = await r.arrayBuffer();
        if (new TextDecoder().decode(buf.slice(0, 7)) !== 'PMTiles') return null;
        src = { getKey: () => PM_URL, getBytes: async (offset, length) => ({ data: buf.slice(offset, offset + length) }) };
      } else {
        const head = await fetch(PM_URL, { method: 'HEAD' });
        const type = head.headers.get('content-type') || '';
        if (!head.ok || type.includes('text/html')) return null;
      }
      window.L = window.L || L; // protomaps-leaflet global L bekler
      const [{ PMTiles }, pm] = await Promise.all([import('pmtiles'), import('protomaps-leaflet')]);
      return { pm, archive: new PMTiles(src) };
    } catch { return null; }
  })();
  return pmPromise;
}

function vectorBase(map, theme, renderer) {
  const base = L.layerGroup().addTo(map);
  CITY.land.forEach((poly) => L.polygon(lls(poly), { renderer, stroke: false, fillColor: theme.land, fillOpacity: 1, interactive: false }).addTo(base));
  CITY.parks.forEach((p) => L.polygon(lls(p.poly), { renderer, stroke: false, fillColor: theme.park, fillOpacity: 1, interactive: false }).addTo(base));
  L.polyline(CITY.roads.minor.map(lls), { renderer, color: theme.minor, weight: 1, interactive: false }).addTo(base);
  L.polyline(CITY.roads.major.map(lls), { renderer, color: theme.major, weight: 2.2, interactive: false }).addTo(base);
  L.polyline(CITY.roads.highway.map(lls), { renderer, color: theme.highway, weight: 4, opacity: 0.8, interactive: false }).addTo(base);
  return base;
}

/** Gerçek, çevrimdışı harita (İstanbul · Kadıköy). Altlık PMTiles dosyasından çizilir; dosya yoksa
 *  OpenStreetMap'ten derlenen vektör katmanlar (kıyı, park, yollar) kullanılır. Hiçbir harita sunucusuna istek atılmaz. */
export function createCityMap(el, opts = {}) {
  const themeKey = opts.theme === 'light' ? 'light' : 'dark';
  const theme = THEMES[themeKey];
  const pad = 0.02;
  const map = L.map(el, {
    minZoom: z(-1.25),
    maxZoom: 18,
    zoomSnap: 0.25,
    zoomControl: false,
    attributionControl: !opts.mini,
    preferCanvas: true,
    maxBounds: [[BBOX.s - pad, BBOX.w - pad], [BBOX.n + pad, BBOX.e + pad]],
    maxBoundsViscosity: 0.8,
    dragging: !opts.static,
    scrollWheelZoom: !opts.static,
    touchZoom: !opts.static,
    doubleClickZoom: !opts.static,
    boxZoom: false,
    keyboard: false,
  });
  if (map.attributionControl) map.attributionControl.setPrefix('').addAttribution(MAP_SOURCE);
  el.style.background = theme.sea;

  const renderer = L.canvas({ padding: 0.5 });
  map.createPane('base').style.zIndex = 250;
  const fallback = vectorBase(map, theme, L.canvas({ padding: 0.5, pane: 'base' }));
  let alive = true;
  map.on('unload', () => (alive = false));
  loadPmtiles().then((res) => {
    if (!res || !alive) return;
    try {
      const layer = res.pm.leafletLayer({ url: res.archive, flavor: themeKey, lang: 'tr', pane: 'base', maxDataZoom: 15, noWrap: true });
      layer.addTo(map);
      map.removeLayer(fallback);
    } catch { /* yedek vektör altlık kalır */ }
  });

  map.fitBounds([toLatLng([0, 0]), toLatLng([SIZE, SIZE])]);
  return { map, renderer, ll, lls, xy, z };
}

export const accentColor = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c6f432';

export function routeLayer(ctx, pts, { color = null, weight = 4, outline = true } = {}) {
  color = color || accentColor();
  const g = L.layerGroup();
  if (outline) L.polyline(ctx.lls(pts), { renderer: ctx.renderer, color: '#0b0c10', weight: weight + 3, opacity: 0.6 }).addTo(g);
  L.polyline(ctx.lls(pts), { renderer: ctx.renderer, color, weight }).addTo(g);
  return g;
}

export function dotMarker(ctx, p, cls = 'dot-marker') {
  return L.marker(ctx.ll(p), { icon: L.divIcon({ className: cls, iconSize: [18, 18] }) });
}

export function pinMarker(ctx, p, html, cls = 'pin-marker') {
  return L.marker(ctx.ll(p), { icon: L.divIcon({ className: cls, html, iconSize: [34, 40], iconAnchor: [17, 40] }) });
}

export function fitPts(ctx, pts, pad = 30) {
  ctx.map.fitBounds(L.latLngBounds(ctx.lls(pts)), { padding: [pad, pad] });
}

// ---------- Mini SVG harita (akış kartları için, Leaflet'siz) ----------
const path = (pts, close) => 'M' + pts.map((p) => `${(+p[0]).toFixed(1)} ${(+p[1]).toFixed(1)}`).join('L') + (close ? 'Z' : '');
const bboxOf = (pts) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; };
const FEAT = {
  parks: CITY.parks.map((p) => ({ b: p.box, d: path(p.poly, true) })),
  minor: CITY.roads.minor.map((l) => ({ b: bboxOf(l), d: path(l) })),
  major: CITY.roads.major.map((l) => ({ b: bboxOf(l), d: path(l) })),
  highway: CITY.roads.highway.map((l) => ({ b: bboxOf(l), d: path(l) })),
};
const LAND = CITY.land.map((p) => path(p, true)).join('');
const pick = (list, [x0, y0, x1, y1]) => list.filter(({ b }) => b[2] >= x0 && b[0] <= x1 && b[3] >= y0 && b[1] <= y1).map((f) => f.d).join('');

/** Kart için yalnızca görünen alandaki gerçek sokakları çizer. */
function svgBase(view) {
  const t = THEMES.dark;
  return `
    <rect x="-200" y="-200" width="1400" height="1400" fill="${t.sea}"/>
    <path d="${LAND}" fill="${t.land}"/>
    <path d="${pick(FEAT.parks, view)}" fill="${t.park}"/>
    <path d="${pick(FEAT.minor, view)}" fill="none" stroke="${t.minor}" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <path d="${pick(FEAT.major, view)}" fill="none" stroke="${t.major}" stroke-width="1.8" vector-effect="non-scaling-stroke"/>
    <path d="${pick(FEAT.highway, view)}" fill="none" stroke="${t.highway}" stroke-width="3" opacity=".8" vector-effect="non-scaling-stroke"/>`;
}


let miniId = 0;
export function miniMapSVG(pts, { aspect = 2, color = 'var(--accent)', live = true } = {}) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  let w = maxX - minX, h = maxY - minY;
  const pad = Math.max(w, h) * 0.18 + 15;
  w += pad * 2; h += pad * 2;
  if (w / h < aspect) { const nw = h * aspect; minX -= (nw - w) / 2 - pad; w = nw; } else { const nh = w / aspect; minY -= (nh - h) / 2 - pad; h = nh; }
  minX -= pad; minY -= pad;
  const vbY = SIZE - (minY + h);
  const start = pts[0], end = pts[pts.length - 1];
  const id = `rt${++miniId}`;
  const step = Math.max(1, Math.floor(pts.length / 300));
  const d = path(pts.filter((_, i) => i % step === 0 || i === pts.length - 1));
  const dur = Math.min(14, Math.max(6, pts.length / 60)).toFixed(1);
  return `<svg class="mini-map ${live ? 'draw-on-view' : ''}" viewBox="${minX.toFixed(1)} ${vbY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1 0 0 -1 0 ${SIZE})">${svgBase([minX, minY, minX + w, minY + h])}
      <path d="${d}" fill="none" stroke="#0b0c10" stroke-width="7" opacity=".55" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <path d="${d}" fill="none" style="stroke:${color}" stroke-width="7" opacity=".18" stroke-linejoin="round" vector-effect="non-scaling-stroke" class="rt-glow"/>
      <path id="${id}" d="${d}" pathLength="1" fill="none" style="stroke:${color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" class="rt-line"/>
      <circle cx="${start[0]}" cy="${start[1]}" r="${w / 70}" fill="#2bd46f" stroke="#fff" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <circle cx="${end[0]}" cy="${end[1]}" r="${w / 70}" fill="#ff4d5e" stroke="#fff" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      ${live ? `<g class="rt-runner"><circle r="${w / 38}" style="fill:${color}" opacity=".35"><animate attributeName="r" values="${w / 60};${w / 26};${w / 60}" dur="1.6s" repeatCount="indefinite"/></circle><circle r="${w / 90}" fill="#fff"/><animateMotion dur="${dur}s" repeatCount="indefinite" rotate="auto"><mpath href="#${id}"/></animateMotion></g>` : ''}
    </g></svg>`;
}
