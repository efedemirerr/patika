import { isEn, tr } from './i18n.js';

const AYLAR = isEn ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  : ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const AY_KISA = isEn ? ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  : ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];
export const GUN_KISA = isEn ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] : ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT'];
const DEC = isEn ? '.' : ',';
export const upper = (s) => String(s).toLocaleUpperCase(isEn ? 'en-US' : 'tr-TR');

export const km = (m, d = 2) => (m / 1000).toFixed(d).replace('.', DEC);
export const pad = (n) => String(n).padStart(2, '0');

export function pace(sec, meters) {
  if (!meters || meters < 10) return '–:––';
  const s = Math.round(sec / (meters / 1000));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

export function speed(sec, meters) {
  if (!sec) return `0${DEC}0`;
  return ((meters / sec) * 3.6).toFixed(1).replace('.', DEC);
}

export function duration(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h) return isEn ? `${h}h ${m}m` : `${h}sa ${m}dk`;
  return isEn ? `${m}m ${s}s` : `${m}dk ${s}sn`;
}

export function clock(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function longDate(iso) {
  const d = new Date(iso);
  return isEn ? `${AYLAR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()} tarihinde saat ${pad(d.getHours())}:${pad(d.getMinutes())} itibarıyla`;
}

export function shortDate(iso) {
  const d = new Date(iso);
  return isEn ? `${AYLAR[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}` : `${d.getDate()} ${AYLAR[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function timeTitle(type, date = new Date()) {
  const h = date.getHours();
  const part = h < 5 ? 'Gece' : h < 12 ? 'Sabah' : h < 17 ? 'Öğleden Sonra' : h < 21 ? 'Akşam' : 'Gece';
  return tr(`${part} ${SPORTS[type].noun}`);
}

export const SPORTS = {
  run: { label: 'Koşu', noun: 'Koşusu', icon: 'shoe' },
  ride: { label: 'Bisiklet', noun: 'Sürüşü', icon: 'bike' },
  walk: { label: 'Yürüyüş', noun: 'Yürüyüşü', icon: 'walk' },
};

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function avatar(user, size = 44) {
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return `<span class="avatar" style="width:${size}px;height:${size}px;background:${user.color};font-size:${size * 0.38}px">${esc(initials)}</span>`;
}

const P = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  map: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13M15 6.5v13"/>',
  record: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5" fill="currentColor"/>',
  groups: '<path d="m12 3 4 5-4 5-4-5 4-5Z"/><path d="m7 10 4 5-4 5-4-5 4-5Zm10 0 4 5-4 5-4-5 4-5Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chat: '<path d="M4 5h11v8H8l-4 3V5Z"/><path d="M9 16v1h7l4 3v-9h-3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3"/>',
  like: '<path d="M7 10v10H4V10h3Z"/><path d="M7 10l4-7c1.7 0 2.5 1 2.2 2.6L12.6 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/>',
  comment: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4"/>',
  layers: '<path d="m12 4 9 5-9 5-9-5 9-5Z"/><path d="m3 14 9 5 9-5"/>',
  locate: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevRight: '<path d="m9 6 6 6-6 6"/>',
  chevLeft: '<path d="m15 6-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  bookmark: '<path d="M6 3.5h12v17l-6-4-6 4v-17Z"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3.2"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  route: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H16a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h7.5"/>',
  shoe: '<path d="M3 15c0-2 1-3 2-5l2-5 4 3 2 3 6 2c1.5.5 2 1.5 2 3v1H3v-2Z"/><path d="M3 19h18"/>',
  bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16 9.5 9h6L18 16M12 16l-2.5-7M14 6h3"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="m10 21 2-6-2-3 1.5-5 3 3 3 1M12 15l3 2 1 4M10.5 8 7 10v3"/>',
  chart: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 16v-4M12 16V9M16 16v-6"/>',
  pulse: '<path d="M3 12h4l2-5 3 10 3-8 2 3h4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  stats: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3.5 19c.5-3.5 2.6-5.5 5.5-5.5s5 2 5.5 5.5M15 14c2.7 0 4.6 1.6 5 4.5"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4c0 3 1.5 4.5 3 4.5M17 6h3c0 3-1.5 4.5-3 4.5M12 14v3M8.5 20h7l-1-3h-5l-1 3Z"/>',
  flame: '<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-4 3.5-6 4-10 2.5 1.5 3.5 4 3.5 6 1-1 1.5-2 1.5-3 2 1.5 4 4.3 4 7 0 3.4-2.5 6-6.5 6Z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>',
  mountain: '<path d="m3 19 6-10 4 6 2.5-3.5L21 19H3Z"/>',
};

export function icon(name, size = 24, extra = '') {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${P[name] || ''}</svg>`;
}

// Özgün marka işareti (MoveCircle): kıvrımlı yol + nokta
export const LOGO = `<svg width="24" height="24" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="24" fill="#141722"/><path d="M 66.07 30.85 A 25 25 0 1 0 74.62 45.66" fill="none" stroke="#c6f432" stroke-width="11" stroke-linecap="round"/><circle cx="72.9" cy="36.6" r="7" fill="#fff"/><circle cx="50" cy="50" r="5" fill="#c6f432"/></svg>`;
