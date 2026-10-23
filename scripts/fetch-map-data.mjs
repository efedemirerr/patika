// Gerçek harita verisini toplar (GitHub Actions'ta çalışır, uygulama çalışırken hiçbir sunucuya istek atılmaz).
// Çıktı: src/map/data.json — yerel düzlem koordinatları (1 birim = 12 m, y kuzeye doğru artar).
// Kaynaklar: OpenStreetMap (Overpass), OSRM yaya/bisiklet rotalama (routing.openstreetmap.de), Open-Meteo yükseklik (Copernicus DEM).
import { writeFileSync } from 'node:fs';

export const BBOX = { s: 40.936, w: 29.0, n: 41.044, e: 29.143 };
const M = 12; // metre / birim
const LAT0 = BBOX.s, LNG0 = BBOX.w;
const KX = 111320 * Math.cos(((BBOX.s + BBOX.n) / 2) * Math.PI / 180), KY = 110574;
const toXY = (lat, lng) => [+(((lng - LNG0) * KX) / M).toFixed(1), +(((lat - LAT0) * KY) / M).toFixed(1)];
const UA = { 'User-Agent': 'MoveCircle-demo-build (github.com/efedemirerr/patika)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, opts = {}, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...opts, headers: { ...UA, ...(opts.headers || {}) } });
      if (r.ok) return await r.json();
      console.warn('HTTP', r.status, url.slice(0, 120));
    } catch (e) { console.warn('ERR', String(e), url.slice(0, 120)); }
    await sleep(3000 * (i + 1));
  }
  throw new Error('failed: ' + url.slice(0, 160));
}

// ---------- geometri yardımcıları ----------
function simplify(pts, tol) { // Douglas–Peucker (kapalı halkalar en uzak noktadan ikiye bölünür)
  if (pts.length < 3) return pts;
  const [fx, fy] = pts[0], [lx, ly] = pts[pts.length - 1];
  if (Math.hypot(fx - lx, fy - ly) < 1e-6) {
    let far = 1, fd = 0;
    for (let i = 1; i < pts.length - 1; i++) { const d = Math.hypot(pts[i][0] - fx, pts[i][1] - fy); if (d > fd) { fd = d; far = i; } }
    const a = simplify(pts.slice(0, far + 1), tol), b = simplify(pts.slice(far), tol);
    return a.concat(b.slice(1));
  }
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b]; const L = Math.hypot(bx - ax, by - ay) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// Ara durak noktalarının yarattığı kısa "git-dön" çıkıntılarını temizler.
function despike(pts, maxLen = 160 / M) {
  let changed = true; let p = pts.slice();
  while (changed) {
    changed = false;
    for (let i = 1; i < p.length - 1; i++) {
      // i noktasında yön tamamen tersine dönüyorsa ve geri dönülen kısım kısaysa, ileri-geri kısmı kes
      for (let k = 1; k < 40 && i - k >= 0 && i + k < p.length; k++) {
        const a = p[i - k], b = p[i + k];
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.05) {
          let len = 0; for (let j = i - k + 1; j <= i; j++) len += Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]);
          if (len <= maxLen) { p.splice(i - k + 1, 2 * k); changed = true; break; }
        } else break;
      }
      if (changed) break;
    }
  }
  return p;
}
const dedupe = (pts) => pts.filter((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.05);

// ---------- rotalar ----------
const ROUTES = [
  { id: 'r1', name: 'Moda Sahil Akşam Turu', surface: 'Asfalt', prof: 'foot', w: [[40.99291, 29.02287], [40.9853, 29.0248], [40.98057, 29.02673], [40.9782, 29.0300], [40.9783, 29.0365]], back: true },
  { id: 'r2', name: 'Moda Sokakları Döngüsü', surface: 'Asfalt', prof: 'foot', w: [[40.9902, 29.0287], [40.9852, 29.0262], [40.9812, 29.0262], [40.98527, 29.03367], [40.9893, 29.0318], [40.9902, 29.0287]] },
  { id: 'r3', name: 'Büyük Çamlıca Tırmanışı', surface: 'Karışık', prof: 'foot', w: [[41.0030, 29.0440], [41.0150, 29.0455], [41.0215, 29.0570], [41.02689, 29.06779]], back: true },
  { id: 'r4', name: 'Göztepe Parkı 5K', surface: 'Asfalt', prof: 'foot', w: [[40.96959, 29.05799], [40.9748, 29.0575], [40.9738, 29.0668], [40.9672, 29.0663], [40.96959, 29.05799]] },
  { id: 'r5', name: 'Fenerbahçe Burnu Koşusu', surface: 'Asfalt', prof: 'foot', w: [[40.97637, 29.03726], [40.9720, 29.0340], [40.96814, 29.0320], [40.9660, 29.0365]], back: true },
  { id: 'r6', name: 'Validebağ Korusu Turu', surface: 'Toprak', prof: 'foot', w: [[41.0175, 29.0440], [41.0162, 29.0482], [41.0125, 29.0467], [41.0135, 29.0430], [41.0175, 29.0440]] },
  { id: 'r7', name: 'Caddebostan Sahil Uzun Koşu', surface: 'Asfalt', prof: 'foot', w: [[40.98057, 29.02673], [40.97637, 29.03726], [40.9668, 29.0390], [40.9620, 29.0640], [40.95544, 29.0796], [40.95156, 29.09426]], back: true },
  { id: 'r8', name: 'Bağdat Caddesi Bisiklet Rotası', surface: 'Asfalt', prof: 'bike', w: [[40.98385, 29.03984], [40.9700, 29.0620], [40.9600, 29.0820], [40.9550, 29.0950]], back: true },
];

async function route(r) {
  const w = r.w;
  const url = `https://routing.openstreetmap.de/routed-${r.prof}/route/v1/driving/${w.map((p) => p[1] + ',' + p[0]).join(';')}?overview=full&geometries=geojson`;
  const j = await getJSON(url);
  let pts = dedupe(j.routes[0].geometry.coordinates.map(([lng, lat]) => toXY(lat, lng)));
  pts = despike(pts);
  pts = simplify(pts, 0.25);
  if (r.back) pts = [...pts, ...pts.slice(0, -1).reverse()];
  return { id: r.id, name: r.name, surface: r.surface, pts };
}

// ---------- OSM katmanları (Overpass) ----------
async function overpass(q) {
  const bb = `${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e}`;
  const body = 'data=' + encodeURIComponent(`[out:json][timeout:120];${q.replaceAll('BB', bb)}out geom;`);
  for (const ep of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
    try { return await getJSON(ep, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 2); } catch (e) { console.warn(String(e)); }
  }
  throw new Error('overpass failed');
}
const wayPts = (g) => g.map((p) => toXY(p.lat, p.lon));
const inBox = ([x, y], pad = 40) => x > -pad && y > -pad && x < 1000 + pad && y < 1000 + pad;

function chain(segs) { // uç uca eklenen yolları birleştir
  segs = segs.map((s) => s.slice());
  const out = [];
  while (segs.length) {
    let cur = segs.pop(); let grew = true;
    while (grew) {
      grew = false;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i]; const eq = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.05;
        if (eq(cur[cur.length - 1], s[0])) { cur = cur.concat(s.slice(1)); }
        else if (eq(s[s.length - 1], cur[0])) { cur = s.concat(cur.slice(1)); }
        else continue;
        segs.splice(i, 1); grew = true; break;
      }
    }
    out.push(cur);
  }
  return out;
}

function polyArea(p) { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(a / 2); }

async function osm() {
  const coast = await overpass('way[natural=coastline](BB);');
  const coastLines = chain(coast.elements.filter((e) => e.geometry).map((e) => wayPts(e.geometry)))
    .map((l) => simplify(l, 0.6)).filter((l) => l.length > 2);
  await sleep(2000);
  const green = await overpass('(way[leisure=park](BB);way[landuse=forest](BB);way[natural=wood](BB);way[leisure=garden][name](BB);relation[leisure=park](BB);relation[landuse=forest](BB););');
  const parks = [];
  for (const e of green.elements) {
    const rings = e.type === 'way' ? [e.geometry] : (e.members || []).filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry);
    const merged = e.type === 'way' ? rings.map(wayPts) : chain(rings.map(wayPts));
    for (const r of merged) {
      if (r.length < 4 || !r.some((p) => inBox(p, 0))) continue;
      const c0 = r.reduce((t, p) => [t[0] + p[0] / r.length, t[1] + p[1] / r.length], [0, 0]);
      if (!inBox(c0, 30)) continue;
      const area = polyArea(r) * M * M;
      if (area < 6000) continue;
      const s = simplify(r, 0.8);
      const cx = s.reduce((t, p) => t + p[0], 0) / s.length, cy = s.reduce((t, p) => t + p[1], 0) / s.length;
      parks.push({ name: e.tags?.name || null, area: Math.round(area), cx: +cx.toFixed(1), cy: +cy.toFixed(1), poly: s });
    }
  }
  parks.sort((a, b) => b.area - a.area);
  await sleep(2000);
  const rd = await overpass('way[highway~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|pedestrian)$"](BB);');
  const roads = { major: [], minor: [], highway: [] };
  for (const e of rd.elements) {
    if (!e.geometry) continue;
    const h = e.tags.highway; const kind = /motorway|trunk/.test(h) ? 'highway' : /primary|secondary|tertiary/.test(h) ? 'major' : 'minor';
    const pts = simplify(wayPts(e.geometry), kind === 'minor' ? 0.9 : 0.5).map(([x, y]) => [Math.round(x), Math.round(y)]);
    if (pts.length > 1 && pts.some((p) => inBox(p, 0))) roads[kind].push(pts);
  }
  for (const k of Object.keys(roads)) roads[k] = chain(roads[k]).map((l) => l.filter((p, i) => !i || p[0] !== l[i - 1][0] || p[1] !== l[i - 1][1])).filter((l) => l.length > 1);
  return { coastLines, parks: parks.slice(0, 60), roads };
}

// ---------- yükseklik ızgarası ----------
async function elevationGrid(n = 26) {
  const lats = [], lngs = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { lats.push(BBOX.s + ((BBOX.n - BBOX.s) * j) / (n - 1)); lngs.push(BBOX.w + ((BBOX.e - BBOX.w) * i) / (n - 1)); }
  const out = [];
  for (let k = 0; k < lats.length; k += 100) {
    const j = await getJSON(`https://api.open-meteo.com/v1/elevation?latitude=${lats.slice(k, k + 100).map((v) => v.toFixed(5)).join(',')}&longitude=${lngs.slice(k, k + 100).map((v) => v.toFixed(5)).join(',')}`);
    out.push(...j.elevation.map((v) => Math.max(0, Math.round(v))));
    await sleep(600);
  }
  return { n, z: out };
}

const routes = [];
for (const r of ROUTES) { routes.push(await route(r)); await sleep(1200); console.log('route', r.id, routes.at(-1).pts.length); }
const layers = await osm();
const elev = await elevationGrid();
const data = {
  meta: { bbox: BBOX, metersPerUnit: M, source: '© OpenStreetMap katkıda bulunanlar · Copernicus DEM (Open-Meteo)', built: new Date().toISOString().slice(0, 10) },
  routes, ...layers, elev,
};
writeFileSync(new URL('../src/map/data.json', import.meta.url), JSON.stringify(data));
console.log('ok', JSON.stringify(data).length, 'bytes', { coast: layers.coastLines.length, parks: layers.parks.length, major: layers.roads.major.length, minor: layers.roads.minor.length });
