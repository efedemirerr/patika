// Tamamen kurgusal, çevrimdışı üretilen şehir: "Liman Şehri".
// Koordinatlar harita birimi (0..1000), 1 birim = 10 metre. y yukarı doğru artar.

export const SIZE = 1000;
export const METERS_PER_UNIT = 10;

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function coastY(x) {
  return 290 + 55 * Math.sin(x / 150 + 0.6) + 22 * Math.sin(x / 47) + (x < 260 ? (260 - x) * 0.35 : 0);
}

const HILL = { x: 790, y: 820, r: 230 };

export function elevation(x, y) {
  const d = Math.hypot(x - HILL.x, y - HILL.y);
  const hill = Math.max(0, 1 - d / HILL.r);
  return Math.round(4 + 260 * hill * hill + Math.max(0, y - coastY(x)) * 0.03);
}

function blob(cx, cy, r, rand, jitter = 0.18, n = 40) {
  const pts = [];
  const phase = rand() * 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + jitter * Math.sin(a * 3 + phase) + jitter * 0.5 * Math.sin(a * 7 + phase * 2);
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
  }
  pts.push(pts[0]);
  return pts;
}

export const DISTRICTS = [
  { name: 'Martılı', cx: 170, cy: 430, r: 125, ang: 0.2 },
  { name: 'Kuzeytepe', cx: 300, cy: 700, r: 150, ang: -0.15 },
  { name: 'Sahilkent', cx: 470, cy: 390, r: 140, ang: 0.35 },
  { name: 'Çınaraltı', cx: 570, cy: 620, r: 125, ang: 0.05 },
  { name: 'Yelkenli', cx: 790, cy: 370, r: 150, ang: -0.3 },
  { name: 'Bağlarbaşı', cx: 110, cy: 830, r: 110, ang: 0.4 },
  { name: 'Taşhan', cx: 920, cy: 570, r: 100, ang: 0.1 },
];

export const PARKS = [
  { name: 'Rüzgâr Parkı', cx: 520, cy: 330, r: 26 },
  { name: 'Kordon Atletizm Alanı', cx: 235, cy: 400, r: 24 },
  { name: 'Çamlık Korusu', cx: 640, cy: 760, r: 42 },
  { name: 'Fener Bahçesi', cx: 870, cy: 300, r: 22 },
];

function buildGeometry() {
  const rand = rng(42);
  const land = [];
  for (let x = -20; x <= SIZE + 20; x += 8) land.push([x, coastY(x)]);
  land.push([SIZE + 20, SIZE + 20], [-20, SIZE + 20], land[0]);

  const hills = blob(HILL.x, HILL.y, HILL.r, rand, 0.12, 60);
  const contours = [];
  for (let r = 40; r < HILL.r; r += 32) contours.push(blob(HILL.x + rand() * 10, HILL.y + rand() * 10, r, rand, 0.16, 48));

  const parks = PARKS.map((p) => ({ ...p, poly: blob(p.cx, p.cy, p.r, rand, 0.15, 24) }));

  // Mahalle sokak ızgaraları
  const streets = [];
  for (const d of DISTRICTS) {
    const s = 17;
    const cos = Math.cos(d.ang), sin = Math.sin(d.ang);
    for (const dir of [0, 1]) {
      for (let u = -d.r; u <= d.r; u += s) {
        let seg = [];
        for (let v = -d.r; v <= d.r; v += 4) {
          const lx = dir ? u : v, ly = dir ? v : u;
          const x = d.cx + lx * cos - ly * sin;
          const y = d.cy + lx * sin + ly * cos;
          const edge = d.r * (0.82 + 0.18 * Math.sin(Math.atan2(ly, lx) * 4 + d.cx));
          const inside = Math.hypot(lx, ly) <= edge && y > coastY(x) + 6 && Math.hypot(x - HILL.x, y - HILL.y) > 120;
          if (inside) seg.push([x, y]);
          else if (seg.length) { if (seg.length > 2) streets.push(seg); seg = []; }
        }
        if (seg.length > 2) streets.push(seg);
      }
    }
  }

  const majors = [];
  const boulevard = [];
  for (let x = 0; x <= SIZE; x += 6) boulevard.push([x, coastY(x) + 14]);
  majors.push(boulevard);
  const avenue = (a, b) => majors.push([a, b]);
  avenue([170, 430], [300, 700]);
  avenue([300, 700], [570, 620]);
  avenue([470, 390], [570, 620]);
  avenue([570, 620], [790, 370]);
  avenue([790, 370], [920, 570]);
  avenue([110, 830], [300, 700]);
  avenue([170, 430], [470, 390]);

  const highway = [];
  for (let x = -20; x <= SIZE + 20; x += 10) highway.push([x, 540 + 45 * Math.sin(x / 210 + 1)]);

  const labels = [
    ...DISTRICTS.map((d) => ({ text: d.name.toLocaleUpperCase('tr'), x: d.cx, y: d.cy + 10, kind: 'district' })),
    ...PARKS.map((p) => ({ text: p.name, x: p.cx, y: p.cy - p.r - 10, kind: 'park' })),
    { text: 'Mavi Körfez', x: 470, y: 150, kind: 'water' },
    { text: 'Liman Şehri', x: 640, y: 470, kind: 'city' },
  ];

  return { land, hills, contours, parks, streets, majors, highway, labels };
}

export const CITY = buildGeometry();

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

function rect(cx, cy, w, h, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const corner = (dx, dy) => [cx + dx * c - dy * s, cy + dx * s + dy * c];
  const p = [corner(-w / 2, -h / 2), corner(w / 2, -h / 2), corner(w / 2, h / 2), corner(-w / 2, h / 2)];
  return [...p, p[0]];
}

function coastPath(x0, x1, off = 14) {
  const pts = [];
  const step = x1 > x0 ? 6 : -6;
  for (let x = x0; step > 0 ? x <= x1 : x >= x1; x += step) pts.push([x, coastY(x) + off]);
  return pts;
}

function circle(cx, cy, r, n = 36) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

export function pathLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return d * METERS_PER_UNIT;
}

export function elevationGain(pts) {
  let g = 0;
  for (let i = 1; i < pts.length; i++) {
    const diff = elevation(...pts[i]) - elevation(...pts[i - 1]);
    if (diff > 0) g += diff;
  }
  return g;
}

const RAW_ROUTES = [
  { id: 'r1', name: 'Sahil Akşam Turu', surface: 'Asfalt', pts: [...coastPath(380, 640), ...coastPath(640, 380, 32)] },
  { id: 'r2', name: 'Martılı Blok Döngüsü', surface: 'Asfalt', pts: rect(170, 450, 120, 85, 0.2) },
  { id: 'r3', name: 'Kuzeytepe Tırmanışı', surface: 'Karışık', pts: [[300, 640], [420, 690], [560, 700], [640, 760], [720, 800], [760, 840], [640, 760], [560, 700], [420, 690], [300, 640]] },
  { id: 'r4', name: 'Çınaraltı 5K', surface: 'Asfalt', pts: rect(570, 620, 160, 90, 0.05) },
  { id: 'r5', name: 'Yelkenli Liman Koşusu', surface: 'Asfalt', pts: [...coastPath(700, 960), ...coastPath(960, 700, 30)] },
  { id: 'r6', name: 'Rüzgâr Parkı Turu', surface: 'Toprak', pts: [...circle(520, 330, 34), ...circle(520, 330, 34)] },
  { id: 'r7', name: 'Körfez Uzun Koşu', surface: 'Asfalt', pts: [...coastPath(60, 940), ...coastPath(940, 60, 30)] },
  { id: 'r8', name: 'Bağlarbaşı Bisiklet Rotası', surface: 'Karışık', pts: [[110, 830], [300, 700], [570, 620], [790, 370], [920, 570], [790, 370], [570, 620], [300, 700], [110, 830]] },
];

export const ROUTES = RAW_ROUTES.map((r) => {
  const pts = densify(r.pts);
  const distance = pathLength(pts);
  const gain = elevationGain(pts);
  const difficulty = gain > 400 || distance > 15000 ? 'Zor' : gain > 120 || distance > 7000 ? 'Orta' : 'Kolay';
  return { ...r, pts, distance, gain, difficulty };
});

export const routeById = (id) => ROUTES.find((r) => r.id === id);

// Bir yol üzerinde verilen mesafedeki noktayı ve o ana kadarki kısmı döndürür
export function walkPath(pts, meters) {
  const total = pathLength(pts);
  const laps = Math.floor(meters / total);
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
