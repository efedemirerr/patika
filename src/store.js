import { ROUTES, routeById } from './map/city.js';

const KEY = 'patika-state-v1';

export const USERS = {
  me: { id: 'me', name: 'Arda Yel', color: '#7b61ff', city: 'Liman Şehri' },
  u1: { id: 'u1', name: 'Selin Aksoy', color: '#ff7a59', city: 'Liman Şehri' },
  u2: { id: 'u2', name: 'Bora Tunç', color: '#20b2aa', city: 'Kuzeytepe' },
  u3: { id: 'u3', name: 'Ece Karaca', color: '#e0a100', city: 'Sahilkent' },
};

export const CLUBS = [
  { id: 'c1', name: 'Kordon Koşucuları', sport: 'run', members: 214, place: 'Martılı' },
  { id: 'c2', name: 'Yelkenli Pedal Kulübü', sport: 'ride', members: 96, place: 'Yelkenli' },
  { id: 'c3', name: 'Şafak Adımları', sport: 'walk', members: 58, place: 'Çınaraltı' },
  { id: 'c4', name: 'Tepe Avcıları Trail', sport: 'run', members: 131, place: 'Kuzeytepe' },
];

export const CHALLENGES = [
  { id: 'ch1', title: 'Ekim 50 km Koşu', desc: 'Ay bitmeden 50 km koş', goal: 50000, metric: 'distance', sport: 'run', color: '#c6f432' },
  { id: 'ch2', title: 'Haftalık 3 Aktivite', desc: 'Bu hafta 3 aktivite kaydet', goal: 3, metric: 'count', sport: null, color: '#7b61ff' },
  { id: 'ch3', title: 'Tepe Tırmanışı 1000 m', desc: 'Ay içinde 1000 m tırmanış', goal: 1000, metric: 'gain', sport: null, color: '#ff7a59' },
];

export const EVENTS = [
  { id: 'e1', title: 'Kordon Gece Koşusu', club: 'Kordon Koşucuları', members: 214, date: offsetDate(0, 19), place: 'Kordon Atletizm Alanı, Martılı', sport: 'run' },
  { id: 'e2', title: 'Pazar Sahil Sürüşü', club: 'Yelkenli Pedal Kulübü', members: 96, date: offsetDate(3, 8), place: 'Fener Bahçesi, Yelkenli', sport: 'ride' },
  { id: 'e3', title: 'Çamlık Sabah Yürüyüşü', club: 'Şafak Adımları', members: 58, date: offsetDate(5, 7), place: 'Çamlık Korusu girişi', sport: 'walk' },
];

export const RACES = [
  { id: 'rc1', title: 'Liman Şehri Yarı Maratonu', date: offsetDate(10, 9), place: 'Sahilkent, Liman Şehri', dist: '10K · 21K', runners: 1240, hue: 28 },
  { id: 'rc2', title: 'Kuzeytepe Trail Festivali', date: offsetDate(24, 8), place: 'Kuzeytepe Ormanı', dist: '15K · 30K', runners: 410, hue: 140 },
];

export const NOTIFS = [
  { who: 'u1', text: 'aktiviteni beğendi', when: '2 sa' },
  { who: 'u2', text: 'seni takip etmeye başladı', when: 'Dün' },
  { who: 'u3', text: '“Sahil Akşam Turu” rotanı kaydetti', when: '3 gün' },
];

function offsetDate(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function seedActivities() {
  const list = [];
  const now = Date.now();
  let seed = 7;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const plan = [
    // [gün önce, kullanıcı, tür, rota, tempo sn/km]
    [1, 'u1', 'run', 'r1', 330], [2, 'me', 'run', 'r6', 410], [3, 'u2', 'ride', 'r8', 150], [4, 'u3', 'walk', 'r2', 640],
    [6, 'me', 'run', 'r4', 395], [9, 'u1', 'run', 'r5', 345], [12, 'me', 'walk', 'r2', 620], [15, 'me', 'run', 'r1', 402],
    [19, 'u2', 'run', 'r3', 420], [22, 'me', 'run', 'r3', 455], [26, 'me', 'ride', 'r8', 160], [33, 'me', 'run', 'r4', 388],
    [40, 'me', 'run', 'r6', 380], [47, 'me', 'walk', 'r5', 650], [55, 'me', 'run', 'r1', 395], [68, 'me', 'run', 'r7', 372],
  ];
  plan.forEach(([days, userId, type, routeId, paceSec], i) => {
    const route = routeById(routeId);
    const d = new Date(now - days * 86400000);
    d.setHours(7 + Math.floor(r() * 13), Math.floor(r() * 60), 0, 0);
    const distance = route.distance;
    const durationS = Math.round((distance / 1000) * paceSec * (0.95 + r() * 0.1));
    const type2 = type;
    list.push({
      id: 'a' + (i + 1), userId, type: type2, routeId, date: d.toISOString(),
      title: titleFor(type2, d), distance, duration: durationS, gain: route.gain,
      kudos: Math.floor(r() * 9), liked: false, comments: i === 0 ? [{ userId: 'u2', text: 'Harika tempo! 🔥' }] : [], private: false,
    });
  });
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

function titleFor(type, d) {
  const h = d.getHours();
  const part = h < 12 ? 'Sabah' : h < 17 ? 'Öğleden Sonra' : 'Akşam';
  return `${part} ${{ run: 'Koşusu', ride: 'Sürüşü', walk: 'Yürüyüşü' }[type]}`;
}

function defaults() {
  return {
    me: { ...USERS.me, followers: 12, following: 9 },
    activities: seedActivities(),
    savedRoutes: ['r1', 'r4'],
    joinedClubs: ['c1'],
    joinedChallenges: ['ch1'],
    joinedEvents: [],
    mapTheme: 'dark',
    premium: false,
  };
}

let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch { state = defaults(); }

export const store = {
  get: () => state,
  save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} },
  update(fn) { fn(state); store.save(); },
  reset() { state = defaults(); store.save(); },
  user(id) { return id === 'me' ? state.me : USERS[id]; },
  activity(id) { return state.activities.find((a) => a.id === id); },
  myActivities() { return state.activities.filter((a) => a.userId === 'me'); },
  activityPts(a) { return a.path || routeById(a.routeId)?.pts || ROUTES[0].pts; },
  addActivity(a) {
    a.id = 'a' + Date.now();
    state.activities.unshift(a);
    state.activities.sort((x, y) => y.date.localeCompare(x.date));
    store.save();
    return a;
  },
  toggle(listName, id) {
    const l = state[listName];
    const i = l.indexOf(id);
    i >= 0 ? l.splice(i, 1) : l.push(id);
    store.save();
    return i < 0;
  },
};

export function weekStart(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Pazartesi başlangıç
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

export function weeklyTotals(sport = null, weeks = 12) {
  const start = weekStart();
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const s = new Date(start); s.setDate(s.getDate() - i * 7);
    buckets.push({ start: s, duration: 0, distance: 0, count: 0 });
  }
  for (const a of store.myActivities()) {
    if (sport && a.type !== sport) continue;
    const t = new Date(a.date).getTime();
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (t >= buckets[i].start.getTime()) {
        if (i === buckets.length - 1 || t < buckets[i + 1].start.getTime()) { buckets[i].duration += a.duration; buckets[i].distance += a.distance; buckets[i].count++; }
        break;
      }
    }
  }
  return buckets;
}

export function streakWeeks() {
  const w = weeklyTotals(null, 52);
  let n = 0;
  for (let i = w.length - 1; i >= 0; i--) {
    if (w[i].count) n++;
    else if (i === w.length - 1) continue; // içinde bulunulan hafta henüz boş olabilir
    else break;
  }
  return n;
}

export function challengeProgress(ch) {
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const since = ch.metric === 'count' ? weekStart() : month;
  const acts = store.myActivities().filter((a) => new Date(a.date) >= since && (!ch.sport || a.type === ch.sport));
  const val = ch.metric === 'distance' ? acts.reduce((s, a) => s + a.distance, 0) : ch.metric === 'gain' ? acts.reduce((s, a) => s + a.gain, 0) : acts.length;
  return Math.min(1, val / ch.goal);
}
