import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CITY, SIZE } from './city.js';

const ll = (p) => [p[1], p[0]]; // [x,y] -> [lat,lng]
const lls = (pts) => pts.map(ll);

export const THEMES = {
  dark: { sea: '#0e2537', land: '#1b1d26', hills: '#1c3329', contour: '#2c5643', park: '#22543a', street: '#363c55', major: '#6670a3', highway: '#8a8fa0', label: '#c9cbd6' },
  light: { sea: '#a9d2ec', land: '#f1efe9', hills: '#d6e8cf', contour: '#b5d3a8', park: '#bfe0b0', street: '#d4d1c9', major: '#ffffff', highway: '#f2c66d', label: '#3c3f4a' },
};

/** Çevrimdışı vektör haritayı oluşturur (döşeme/tile yok, ağ isteği yok). */
export function createCityMap(el, opts = {}) {
  const theme = THEMES[opts.theme || 'dark'];
  const map = L.map(el, {
    crs: L.CRS.Simple,
    minZoom: -1.5,
    maxZoom: 3,
    zoomSnap: 0.25,
    zoomControl: false,
    attributionControl: !opts.mini,
    preferCanvas: true,
    maxBounds: [[-200, -200], [SIZE + 200, SIZE + 200]],
    dragging: !opts.static,
    scrollWheelZoom: !opts.static,
    touchZoom: !opts.static,
    doubleClickZoom: !opts.static,
    boxZoom: false,
    keyboard: false,
  });
  if (map.attributionControl) map.attributionControl.setPrefix('').addAttribution('Kurgusal çevrimdışı harita · Liman Şehri');
  el.style.background = theme.sea;

  const renderer = L.canvas({ padding: 0.5 });
  const base = L.layerGroup().addTo(map);
  L.polygon(lls(CITY.land), { renderer, stroke: false, fillColor: theme.land, fillOpacity: 1, interactive: false }).addTo(base);
  L.polygon(lls(CITY.hills), { renderer, stroke: false, fillColor: theme.hills, fillOpacity: 1, interactive: false }).addTo(base);
  CITY.contours.forEach((c) => L.polyline(lls(c), { renderer, color: theme.contour, weight: 1, interactive: false }).addTo(base));
  CITY.parks.forEach((p) => L.polygon(lls(p.poly), { renderer, stroke: false, fillColor: theme.park, fillOpacity: 1, interactive: false }).addTo(base));
  L.polyline(CITY.streets.map(lls), { renderer, color: theme.street, weight: 1.2, interactive: false }).addTo(base);
  L.polyline(CITY.majors.map(lls), { renderer, color: theme.major, weight: 2.4, interactive: false }).addTo(base);
  L.polyline(lls(CITY.highway), { renderer, color: theme.highway, weight: 5, opacity: 0.8, interactive: false }).addTo(base);

  if (!opts.mini) {
    CITY.labels.forEach((l) =>
      L.marker(ll([l.x, l.y]), {
        interactive: false,
        icon: L.divIcon({ className: `map-label map-label-${l.kind}`, html: `<span style="color:${theme.label}">${l.text}</span>`, iconSize: [0, 0] }),
      }).addTo(base)
    );
  }

  map.fitBounds([[0, 0], [SIZE, SIZE]]);
  return { map, renderer, ll, lls };
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
let svgBaseCache = null;
const path = (pts, close) => 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + (close ? 'Z' : '');

function svgBase() {
  if (svgBaseCache) return svgBaseCache;
  const t = THEMES.dark;
  svgBaseCache = `
    <rect x="-200" y="-200" width="1400" height="1400" fill="${t.sea}"/>
    <path d="${path(CITY.land, true)}" fill="${t.land}"/>
    <path d="${path(CITY.hills, true)}" fill="${t.hills}"/>
    ${CITY.contours.map((c) => `<path d="${path(c)}" fill="none" stroke="${t.contour}" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('')}
    ${CITY.parks.map((p) => `<path d="${path(p.poly, true)}" fill="${t.park}"/>`).join('')}
    <path d="${CITY.streets.map((s) => path(s)).join('')}" fill="none" stroke="${t.street}" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <path d="${CITY.majors.map((s) => path(s)).join('')}" fill="none" stroke="${t.major}" stroke-width="1.8" vector-effect="non-scaling-stroke"/>
    <path d="${path(CITY.highway)}" fill="none" stroke="${t.highway}" stroke-width="3" opacity=".8" vector-effect="non-scaling-stroke"/>`;
  return svgBaseCache;
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
    <g transform="matrix(1 0 0 -1 0 ${SIZE})">${svgBase()}
      <path d="${d}" fill="none" stroke="#0b0c10" stroke-width="7" opacity=".55" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <path d="${d}" fill="none" style="stroke:${color}" stroke-width="7" opacity=".18" stroke-linejoin="round" vector-effect="non-scaling-stroke" class="rt-glow"/>
      <path id="${id}" d="${d}" pathLength="1" fill="none" style="stroke:${color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" class="rt-line"/>
      <circle cx="${start[0]}" cy="${start[1]}" r="${w / 70}" fill="#2bd46f" stroke="#fff" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <circle cx="${end[0]}" cy="${end[1]}" r="${w / 70}" fill="#ff4d5e" stroke="#fff" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      ${live ? `<g class="rt-runner"><circle r="${w / 38}" style="fill:${color}" opacity=".35"><animate attributeName="r" values="${w / 60};${w / 26};${w / 60}" dur="1.6s" repeatCount="indefinite"/></circle><circle r="${w / 90}" fill="#fff"/><animateMotion dur="${dur}s" repeatCount="indefinite" rotate="auto"><mpath href="#${id}"/></animateMotion></g>` : ''}
    </g></svg>`;
}
