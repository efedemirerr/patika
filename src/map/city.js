// Gerçek harita: İstanbul, Kadıköy çevresi (Moda, Fenerbahçe, Caddebostan, Validebağ, Çamlıca).
// Veri: scripts/fetch-map-data.mjs ile GitHub Actions'ta üretilen src/map/data.json
// (© OpenStreetMap katkıda bulunanlar, OSRM rotalama, Copernicus DEM). Uygulama çalışırken ağ isteği yok.
//
// Uygulamanın içi yerel bir düzlem kullanır: 1 birim = 12 m, x doğuya, y kuzeye doğru artar.
// Böylece mesafe, tempo, film, mühür gibi tüm hesaplar metre cinsinden doğru kalır;
// gerçek enlem/boylama dönüşüm yalnızca harita çizilirken yapılır (toLatLng / fromLatLng).
import DATA from './data.json';

export const SIZE = 1000;
export const METERS_PER_UNIT = DATA.meta.metersPerUnit;
export const BBOX = DATA.meta.bbox;
export const MAP_SOURCE = DATA.meta.source;

const KX = 111320 * Math.cos(((BBOX.s + BBOX.n) / 2) * Math.PI / 180), KY = 110574;
export const toLatLng = ([x, y]) => [BBOX.s + (y * METERS_PER_UNIT) / KY, BBOX.w + (x * METERS_PER_UNIT) / KX];
export const fromLatLng = (lat, lng) => [((lng - BBOX.w) * KX) / METERS_PER_UNIT, ((lat - BBOX.s) * KY) / METERS_PER_UNIT];
export const inArea = ([x, y]) => x >= 0 && y >= 0 && x <= SIZE && y <= SIZE;

// ---------- Yükseklik (Copernicus DEM ızgarası, çift doğrusal) ----------
const EW = ((BBOX.e - BBOX.w) * KX) / METERS_PER_UNIT, EH = ((BBOX.n - BBOX.s) * KY) / METERS_PER_UNIT;
export function elevation(x, y) {
  const { n, z } = DATA.elev;
  const gx = Math.min(n - 1.0001, Math.max(0, (x / EW) * (n - 1))), gy = Math.min(n - 1.0001, Math.max(0, (y / EH) * (n - 1)));
  const i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
  const v = (a, b) => z[b * n + a];
  return Math.round(v(i, j) * (1 - fx) * (1 - fy) + v(i + 1, j) * fx * (1 - fy) + v(i, j + 1) * (1 - fx) * fy + v(i + 1, j + 1) * fx * fy);
}

// ---------- Kıyı, kara ve yeşil alanlar ----------
const clamp = ([x, y]) => [Math.min(SIZE, Math.max(0, x)), Math.min(SIZE, Math.max(0, y))];
const perim = ([x, y]) => (y <= 0 ? x : x >= SIZE ? SIZE + y : y >= SIZE ? 3 * SIZE - x : 4 * SIZE - y); // saat yönü tersine çevre konumu
const CORNERS = [[SIZE, 0, SIZE], [SIZE, SIZE, 2 * SIZE], [0, SIZE, 3 * SIZE], [0, 0, 4 * SIZE]];

/** OSM kıyı çizgileri (kara solda) → kara çokgenleri. Açık zincirler alanın kenarından dolanarak kapatılır. */
function buildLand() {
  const polys = [];
  for (const line of DATA.coastLines) {
    const closed = Math.hypot(line[0][0] - line.at(-1)[0], line[0][1] - line.at(-1)[1]) < 0.5;
    if (closed) { polys.push(line); continue; }
    const pts = line.map(clamp);
    const t0 = perim(pts.at(-1)); let t1 = perim(pts[0]); if (t1 < t0) t1 += 4 * SIZE;
    const ring = pts.slice();
    for (const [cx, cy, ct] of [...CORNERS, ...CORNERS.map(([a, b, c]) => [a, b, c + 4 * SIZE])]) if (ct > t0 && ct < t1) ring.push([cx, cy]);
    ring.push(pts[0]);
    polys.push(ring);
  }
  return polys;
}
const COAST_PTS = DATA.coastLines.flat();

function pip(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export const PARKS = DATA.parks.map((p) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of p.poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { ...p, box: [x0, y0, x1, y1] };
});

/** Nokta bir park / koru / orman içinde mi? */
export function greenAt(x, y) {
  return PARKS.some((p) => x >= p.box[0] - 3 && x <= p.box[2] + 3 && y >= p.box[1] - 3 && y <= p.box[3] + 3 && pip(x, y, p.poly));
}

/** Kıyıya uzaklık (metre). */
export function coastDistance(x, y) {
  let d = Infinity;
  for (let i = 0; i < COAST_PTS.length; i += 2) { const p = COAST_PTS[i]; const q = Math.hypot(p[0] - x, p[1] - y); if (q < d) d = q; }
  return d * METERS_PER_UNIT;
}

export const CITY = { land: buildLand(), parks: PARKS, roads: DATA.roads };

// ---------- Rotalar ----------
function densify(pts, step = 3) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
}

export function pathLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return d * METERS_PER_UNIT;
}

export function elevationGain(pts) {
  let g = 0;
  // ızgara gürültüsünü bastırmak için ~100 m'de bir örnekle
  const step = Math.max(1, Math.round(100 / METERS_PER_UNIT / 3));
  let prev = elevation(...pts[0]);
  for (let i = step; i < pts.length; i += step) {
    const e = elevation(...pts[i]);
    if (e > prev) g += e - prev;
    prev = e;
  }
  return Math.round(g);
}

export const ROUTES = DATA.routes.map((r) => {
  const pts = densify(r.pts);
  const distance = pathLength(pts);
  const gain = elevationGain(pts);
  const difficulty = gain > 250 || distance > 15000 ? 'Zor' : gain > 70 || distance > 7000 ? 'Orta' : 'Kolay';
  return { ...r, pts, distance, gain, difficulty };
});

export const routeById = (id) => ROUTES.find((r) => r.id === id);

// Bir yol üzerinde verilen mesafedeki noktayı ve o ana kadarki kısmı döndürür
export function walkPath(pts, meters) {
  const total = pathLength(pts);
  const laps = total ? Math.floor(meters / total) : 0;
  let remain = (meters - laps * total) / METERS_PER_UNIT;
  const traveled = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (remain <= seg) {
      const t = seg ? remain / seg : 0;
      const p = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
      traveled.push(p);
      return { point: p, traveled, laps };
    }
    remain -= seg;
    traveled.push(pts[i]);
  }
  return { point: pts[pts.length - 1], traveled, laps };
}
