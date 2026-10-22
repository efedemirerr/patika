// Kod ile üretilen özgün illüstrasyonlar: yarış sahneleri, kulüp amblemleri, meydan okuma madalyaları.
// Her görsel tohumludur (aynı girdi → aynı çizim) ve hafif, döngüsel animasyonlar içerir.

let uid = 0;
const nextId = (p) => `${p}${++uid}`;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const hash = (str) => [...String(str)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const f1 = (n) => n.toFixed(1);

/** Dalgalı sırt çizgisi (dağ / tepe silueti) */
function ridge(r, { y, amp, w = 400, h = 230, step = 8, rough = 0.5 }) {
  let pts = [];
  let v = 0;
  for (let x = -10; x <= w + 10; x += step) {
    v = v * rough + (r() - 0.5) * amp;
    pts.push([x, y + v + Math.sin(x / 47 + y) * amp * 0.35]);
  }
  return `M${pts.map(([x, yy]) => `${f1(x)} ${f1(yy)}`).join('L')}L${w + 10} ${h}L-10 ${h}Z`;
}

const grain = (id) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .06 0"/></filter>`;

// ---------------- Şehir sahili sahnesi (yol yarışı) ----------------
function cityScene(seed) {
  const r = rng(seed);
  const id = nextId('cs');
  const W = 400, H = 230, horizon = 150;
  let far = '', near = '', windows = '';
  // Uzak siluet
  for (let x = -6; x < W + 10;) {
    const bw = 10 + r() * 16, bh = 22 + r() * 38;
    far += `<rect x="${f1(x)}" y="${f1(horizon - bh)}" width="${f1(bw)}" height="${f1(bh + 2)}"/>`;
    x += bw + 1 + r() * 3;
  }
  // Yakın binalar + pencereler
  for (let x = -4; x < 300;) {
    const bw = 16 + r() * 22, bh = 30 + r() * (x > 90 && x < 170 ? 70 : 45);
    const top = horizon + 6 - bh;
    near += `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(bw)}" height="${f1(bh)}"/>`;
    if (r() > 0.75) near += `<rect x="${f1(x + bw / 2 - 1)}" y="${f1(top - 10)}" width="2" height="10"/>`;
    for (let wy = top + 5; wy < horizon; wy += 7) for (let wx = x + 3; wx < x + bw - 4; wx += 6) {
      if (r() > 0.62) {
        const flick = r() > 0.93;
        windows += `<rect x="${f1(wx)}" y="${f1(wy)}" width="2.6" height="3.2" fill="#ffd38a" opacity="${f1(0.55 + r() * 0.45)}">${flick ? `<animate attributeName="opacity" values="1;.2;1" dur="${f1(2 + r() * 4)}s" repeatCount="indefinite"/>` : ''}</rect>`;
      }
    }
    x += bw + 2 + r() * 4;
  }
  // Su yansıması çizgileri
  let shimmer = '';
  for (let i = 0; i < 14; i++) {
    const y = horizon + 10 + i * 4.6, w = 70 - i * 3.5 + r() * 10, x = 300 - w / 2 + (r() - 0.5) * 10;
    shimmer += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="1.6" rx=".8" fill="#ffcf8a" opacity="${f1(0.5 - i * 0.03)}"><animate attributeName="opacity" values="${f1(0.5 - i * 0.03)};${f1(0.15)};${f1(0.5 - i * 0.03)}" dur="${f1(2.5 + r() * 2)}s" begin="${f1(r() * 2)}s" repeatCount="indefinite"/></rect>`;
  }
  let waves = '';
  for (let i = 0; i < 6; i++) { const y = horizon + 14 + i * 12; waves += `<path d="M-10 ${y} q 25 -3 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" fill="none" stroke="#ffffff" stroke-opacity="${f1(0.05 + i * 0.012)}" stroke-width="1"/>`; }
  const birds = [0, 1, 2].map((i) => `<path d="M0 0 q 3 -3 6 0 q 3 -3 6 0" fill="none" stroke="#2a2440" stroke-width="1.3" stroke-linecap="round" transform="translate(${60 + i * 16} ${40 + i * 7})"><animateTransform attributeName="transform" type="translate" values="${-30 + i * 14} ${44 + i * 6}; ${430 + i * 14} ${30 + i * 6}" dur="${22 + i * 3}s" begin="-${i * 5}s" repeatCount="indefinite"/></path>`).join('');
  const road = 'M -10 206 C 70 196, 120 188, 190 186 S 330 176, 410 170';
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2350"/><stop offset=".45" stop-color="#6b3f78"/><stop offset=".78" stop-color="#e2694e"/><stop offset="1" stop-color="#ffb46b"/></linearGradient>
      <linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a6a"/><stop offset="1" stop-color="#151a33"/></linearGradient>
      <radialGradient id="${id}sun"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#ffc96b"/><stop offset="1" stop-color="#ff8a4a" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
      ${grain(`${id}g`)}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${id}sky)"/>
    <g opacity=".35" fill="#ffd9c2"><ellipse cx="90" cy="52" rx="60" ry="3"><animateTransform attributeName="transform" type="translate" values="0 0;30 0;0 0" dur="40s" repeatCount="indefinite"/></ellipse><ellipse cx="200" cy="74" rx="80" ry="2.4"><animateTransform attributeName="transform" type="translate" values="0 0;-24 0;0 0" dur="34s" repeatCount="indefinite"/></ellipse></g>
    <circle cx="300" cy="${horizon - 12}" r="60" fill="url(#${id}sun)" opacity=".8"><animate attributeName="r" values="56;64;56" dur="7s" repeatCount="indefinite"/></circle>
    <circle cx="300" cy="${horizon - 12}" r="17" fill="#fff1c8"/>
    <g fill="#4b2f63" opacity=".85">${far}</g>
    <rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#${id}sea)"/>
    ${waves}${shimmer}
    <g fill="#1a1530">${near}</g>
    <g>${windows}</g>
    <g transform="translate(352 ${horizon - 44})">
      <path d="M-14 -10 L-60 -26 L-60 6 Z" fill="#fff3c4" opacity=".18"><animateTransform attributeName="transform" type="rotate" values="0 0 -6; 25 0 -6; 0 0 -6; -25 0 -6; 0 0 -6" dur="6s" repeatCount="indefinite"/></path>
      <path d="M-5 0 L5 0 L7 46 L-7 46 Z" fill="#f2efe8"/><path d="M-6 12 h12 M-6.5 24 h13 M-7 36 h14" stroke="#d2492a" stroke-width="4"/>
      <rect x="-6" y="-10" width="12" height="10" fill="#ffe08a"><animate attributeName="opacity" values="1;.6;1" dur="2s" repeatCount="indefinite"/></rect>
      <path d="M-8 -10 L0 -18 L8 -10 Z" fill="#1a1530"/><rect x="-16" y="46" width="40" height="4" fill="#1a1530"/>
    </g>
    ${birds}
    <path d="${road} L 410 ${H} L -10 ${H} Z" fill="#100d1f"/>
    <path d="${road}" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="10"/>
    <path id="${id}rd" d="${road}" fill="none" style="stroke:var(--accent, #c6f432)" stroke-width="2.6" stroke-dasharray="9 7" class="march"/>
    ${[0, 1, 2].map((i) => `<g><circle r="${i === 0 ? 4.2 : 3.2}" fill="#fff"/><circle r="9" style="fill:var(--accent, #c6f432)" opacity=".25"/><animateMotion dur="${12 + i * 2.5}s" begin="-${i * 3.4}s" repeatCount="indefinite"><mpath href="#${id}rd"/></animateMotion></g>`).join('')}
    <rect width="${W}" height="${H}" fill="url(#${id}fade)"/>
    <rect width="${W}" height="${H}" filter="url(#${id}g)"/>
  </svg>`;
}

// ---------------- Dağ patikası sahnesi (trail) ----------------
function trailScene(seed) {
  const r = rng(seed);
  const id = nextId('ts');
  const W = 400, H = 230;
  const layers = [
    { y: 92, amp: 26, c: '#9fb3c8', o: 0.9 }, { y: 112, amp: 22, c: '#6f8aa3', o: 1 },
    { y: 138, amp: 18, c: '#3f5c6a', o: 1 }, { y: 162, amp: 14, c: '#26423f', o: 1 }, { y: 190, amp: 10, c: '#15281f', o: 1 },
  ];
  const ridges = layers.map((L) => `<path d="${ridge(r, { y: L.y, amp: L.amp, rough: 0.65 })}" fill="${L.c}" opacity="${L.o}"/>`);
  const pines = (n, yBase, s, color) => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = r() * W, sc = s * (0.7 + r() * 0.6), y = yBase + r() * 12;
      out += `<path d="M${f1(x)} ${f1(y - 16 * sc)} L${f1(x - 5 * sc)} ${f1(y - 6 * sc)} L${f1(x - 2.5 * sc)} ${f1(y - 6 * sc)} L${f1(x - 7 * sc)} ${f1(y + 2 * sc)} L${f1(x + 7 * sc)} ${f1(y + 2 * sc)} L${f1(x + 2.5 * sc)} ${f1(y - 6 * sc)} L${f1(x + 5 * sc)} ${f1(y - 6 * sc)}Z" fill="${color}"/>`;
    }
    return out;
  };
  let stars = '';
  for (let i = 0; i < 22; i++) stars += `<circle cx="${f1(r() * W)}" cy="${f1(r() * 60)}" r="${f1(0.4 + r() * 0.9)}" fill="#fff" opacity="${f1(0.3 + r() * 0.6)}"><animate attributeName="opacity" values=".9;.2;.9" dur="${f1(2 + r() * 4)}s" begin="${f1(r() * 3)}s" repeatCount="indefinite"/></circle>`;
  const trail = 'M 70 228 C 110 214, 150 214, 170 200 S 150 178, 190 170 S 250 160, 232 146 S 250 126, 290 120 S 318 104, 300 92';
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2033"/><stop offset=".5" stop-color="#2f5c6e"/><stop offset=".85" stop-color="#e9b48a"/><stop offset="1" stop-color="#f6d3a8"/></linearGradient>
      <linearGradient id="${id}mist" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
      ${grain(`${id}g`)}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${id}sky)"/>
    ${stars}
    <circle cx="86" cy="46" r="11" fill="#fdf3d8"/><circle cx="91" cy="42" r="10" fill="#1d3647" opacity=".9"/>
    ${ridges[0]}
    <path d="M 286 70 l 12 -16 l 14 18 l -8 -2 l -6 6 l -5 -5 Z" fill="#f3f6fa" opacity=".9"/>
    ${ridges[1]}
    <rect x="-200" y="112" width="420" height="16" fill="url(#${id}mist)"><animateTransform attributeName="transform" type="translate" values="0 0;300 0;0 0" dur="26s" repeatCount="indefinite"/></rect>
    ${ridges[2]}${pines(14, 150, 0.8, '#2b4a45')}
    <rect x="200" y="150" width="380" height="12" fill="url(#${id}mist)" opacity=".7"><animateTransform attributeName="transform" type="translate" values="0 0;-320 0;0 0" dur="32s" repeatCount="indefinite"/></rect>
    ${ridges[3]}${pines(18, 176, 1.1, '#1b332b')}
    <path d="${trail}" fill="none" stroke="#f6d3a8" stroke-opacity=".25" stroke-width="7" stroke-linecap="round"/>
    <path id="${id}tr" d="${trail}" fill="none" style="stroke:var(--accent, #c6f432)" stroke-width="2.4" stroke-dasharray="7 6" stroke-linecap="round" class="march"/>
    <g><circle r="4" fill="#fff"/><circle r="10" style="fill:var(--accent, #c6f432)" opacity=".25"><animate attributeName="r" values="7;12;7" dur="1.6s" repeatCount="indefinite"/></circle><animateMotion dur="14s" repeatCount="indefinite"><mpath href="#${id}tr"/></animateMotion></g>
    <g transform="translate(300 92)"><path d="M0 0 V-16" stroke="#f3f6fa" stroke-width="1.6"/><path d="M0 -16 L11 -12 L0 -8 Z" style="fill:var(--accent, #c6f432)"><animateTransform attributeName="transform" type="skewY" values="0;-8;0;6;0" dur="2.4s" repeatCount="indefinite"/></path></g>
    ${ridges[4]}${pines(10, 214, 1.5, '#0d1a14')}
    <rect width="${W}" height="${H}" fill="url(#${id}fade)"/>
    <rect width="${W}" height="${H}" filter="url(#${id}g)"/>
  </svg>`;
}

export function raceArt(race) {
  const seed = hash(race.id);
  return race.scene === 'trail' ? trailScene(seed) : cityScene(seed);
}

// ---------------- Kulüp amblemi ----------------
const SPORT_TINT = { run: ['#ff8a3d', '#d2492a'], ride: ['#4aa3ff', '#2b5fd9'], walk: ['#7bd88f', '#2f9e5b'] };
const SPORT_GLYPH = {
  run: '<path d="M-7 4c0-2 1-3 2-5l2-5 4 3 2 3 6 2c1.5.5 2 1.5 2 3v1H-7v-2Z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>',
  ride: '<g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="-6" cy="3" r="4"/><circle cx="7" cy="3" r="4"/><path d="M-6 3 -2 -5h7l2 8M1 3l-3-8M4 -8h3"/></g>',
  walk: '<g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="1" cy="-9" r="2"/><path d="m-2 10 2-6-2-3 1.5-5 3 3 3 1M0 4l3 2 1 4M-1.5 -3-5 -1v3"/></g>',
};

export function clubBadge(club, size = 56) {
  const id = nextId('cb');
  const [a, b] = SPORT_TINT[club.sport] || SPORT_TINT.run;
  const initials = club.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toLocaleUpperCase('tr');
  const r = rng(hash(club.id));
  const stripes = Array.from({ length: 5 }, (_, i) => `<path d="M-40 ${-14 + i * 9 + r() * 3} L40 ${-26 + i * 9 + r() * 3}" stroke="#fff" stroke-opacity=".08" stroke-width="3"/>`).join('');
  const name = club.name.toLocaleUpperCase('tr');
  return `<svg class="club-badge" width="${size}" height="${size}" viewBox="-30 -30 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
      <path id="${id}p" d="M-22 0 A22 22 0 1 1 22 0 A22 22 0 1 1 -22 0"/>
      <clipPath id="${id}c"><circle r="17"/></clipPath>
    </defs>
    <circle r="29" fill="#0f1015"/><circle r="27.5" fill="none" stroke="url(#${id}g)" stroke-width="1.2"/>
    <text font-size="5.2" font-weight="800" letter-spacing="1.1" fill="#ffffffb0" font-family="system-ui, sans-serif"><textPath href="#${id}p" startOffset="0">${name} · ${name} ·</textPath><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="40s" repeatCount="indefinite"/></text>
    <circle r="17" fill="url(#${id}g)"/>
    <g clip-path="url(#${id}c)">${stripes}</g>
    <g transform="translate(0 -3) scale(.82)">${SPORT_GLYPH[club.sport] || SPORT_GLYPH.run}</g>
    <text y="12" text-anchor="middle" font-size="6.5" font-weight="900" fill="#fff" font-family="system-ui, sans-serif" letter-spacing=".6">${initials}</text>
  </svg>`;
}

// ---------------- Meydan okuma madalyası ----------------
export function challengeMedal(ch, progress = 0, joined = false, size = 64) {
  const id = nextId('md');
  const label = ch.metric === 'distance' ? `${Math.round(ch.goal / 1000)}` : ch.metric === 'gain' ? `${ch.goal}` : `${ch.goal}×`;
  const unit = ch.metric === 'distance' ? 'KM' : ch.metric === 'gain' ? 'M' : '';
  const R = 27, C = 2 * Math.PI * R;
  // Altıgen madalya + kurdele + ilerleme halkası
  const hex = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return `${f1(Math.cos(a) * 20)} ${f1(Math.sin(a) * 20)}`; }).join(' L');
  return `<svg class="medal" width="${size}" height="${size}" viewBox="-32 -32 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${id}m" x1="0" y1="-1" x2="0" y2="1"><stop offset="0" stop-color="${ch.color}"/><stop offset="1" stop-color="${ch.color}" stop-opacity=".55"/></linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="${id}c"><path d="M${hex}Z"/></clipPath>
    </defs>
    <path d="M-9 10 L-14 30 L-7 26 L-3 31 L1 14 Z" fill="${ch.color}" opacity=".55"/><path d="M9 10 L14 30 L7 26 L3 31 L-1 14 Z" fill="${ch.color}" opacity=".75"/>
    <circle r="${R}" fill="none" stroke="#ffffff14" stroke-width="3"/>
    ${joined ? `<circle r="${R}" fill="none" stroke="${ch.color}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${f1(C * progress)} ${f1(C)}" transform="rotate(-90)" class="medal-ring" style="--len:${f1(C * progress)}"/>` : ''}
    <path d="M${hex}Z" fill="#14151b" stroke="url(#${id}m)" stroke-width="2.4"/>
    <g clip-path="url(#${id}c)">
      <path d="M${hex}Z" fill="url(#${id}m)" opacity=".22"/>
      <rect x="-40" y="-30" width="18" height="60" fill="url(#${id}s)" transform="rotate(20)"><animateTransform attributeName="transform" type="translate" values="-30 0; 70 0" dur="3.8s" repeatCount="indefinite" additive="sum"/></rect>
    </g>
    <text y="${unit ? 2 : 5}" text-anchor="middle" font-size="${label.length > 3 ? 11 : 14}" font-weight="900" fill="#fff" font-family="system-ui, sans-serif">${label}</text>
    ${unit ? `<text y="11" text-anchor="middle" font-size="6" font-weight="800" letter-spacing="1" fill="${ch.color}" font-family="system-ui, sans-serif">${unit}</text>` : ''}
  </svg>`;
}
