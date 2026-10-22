// Ritim Partisyonu: km bölümleri nota dizeğine yazılır ve dinlenebilir.
// Hızlı km = yüksek nota, yavaş km = alçak nota. Melodi tamamen bu aktivitenin temposundan üretilir.
import { splitTimes } from './seal.js';
import { pace } from '../util.js';

// Pentatonik dizi (her zaman kulağa uyumlu gelir): C majör pentatonik, iki oktav
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

export function rhythmData(a) {
  const splits = splitTimes(a).filter((s) => s.meters >= 300);
  const paces = splits.map((s) => s.sec / (s.meters / 1000));
  const fast = Math.min(...paces), slow = Math.max(...paces);
  return splits.map((s, i) => {
    const t = slow === fast ? 0.5 : (slow - paces[i]) / (slow - fast); // 1 = en hızlı
    const step = Math.round(t * (SCALE.length - 1));
    return { km: s.km, pace: paces[i], step, freq: SCALE[step], best: paces[i] === fast && splits.length > 1, partial: s.meters < 1000 };
  });
}

/** Nota dizeği SVG'si. Her not data-i taşır; çalarken vurgulanır. */
export function staffSVG(notes) {
  const n = notes.length;
  const W = Math.max(320, 60 + n * 34), H = 150, top = 30, gap = 10;
  const lines = [0, 1, 2, 3, 4].map((i) => `<line x1="14" x2="${W - 10}" y1="${top + i * gap}" y2="${top + i * gap}" stroke="currentColor" stroke-opacity=".28"/>`).join('');
  // Basit, özgün anahtar işareti: döngüsel rota
  const clef = `<path d="M30 ${top + 44} C 18 ${top + 30}, 24 ${top - 8}, 34 ${top + 2} S 40 ${top + 34}, 28 ${top + 30}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
  const yOf = (step) => top + 4 * gap + 10 - step * (gap / 2) * 1.0;
  const heads = notes.map((nt, i) => {
    const x = 64 + i * 34, y = yOf(nt.step);
    const up = nt.step < 5;
    const ledger = y > top + 4 * gap + 2 ? `<line x1="${x - 9}" x2="${x + 9}" y1="${top + 5 * gap}" y2="${top + 5 * gap}" stroke="currentColor" stroke-opacity=".28"/>` : '';
    return `<g class="note ${nt.best ? 'best' : ''}" data-i="${i}">
      ${ledger}
      <ellipse cx="${x}" cy="${y}" rx="6.6" ry="4.8" transform="rotate(-18 ${x} ${y})" class="head"/>
      <line x1="${up ? x + 6 : x - 6}" x2="${up ? x + 6 : x - 6}" y1="${y}" y2="${up ? y - 30 : y + 30}" class="stem" stroke-width="1.6"/>
      <text x="${x}" y="${H - 22}" text-anchor="middle" class="km">${nt.km}</text>
      <text x="${x}" y="${H - 8}" text-anchor="middle" class="pc">${pace(nt.pace, 1000)}</text>
      <title>${nt.km}. km · ${pace(nt.pace, 1000)} /km</title>
    </g>`;
  }).join('');
  return `<svg class="staff" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${lines}${clef}<rect class="playhead" x="0" y="${top - 8}" width="3" height="${4 * gap + 16}" rx="1.5" opacity="0"/>${heads}</svg>`;
}

let ctx = null;
/** Melodiyi çalar. onNote(i) her notada çağrılır. Döndürdüğü fonksiyon durdurur. */
export function playRhythm(notes, onNote, onEnd) {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  const beat = 0.42;
  const t0 = ctx.currentTime + 0.08;
  const master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
  notes.forEach((n, i) => {
    const t = t0 + i * beat;
    const dur = n.partial ? beat * 0.5 : beat * 0.92;
    for (const [mult, vol, type] of [[1, 1, 'triangle'], [2, 0.18, 'sine']]) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type; o.frequency.value = n.freq * mult;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * (n.best ? 1.25 : 1), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    }
  });
  const timers = notes.map((_, i) => setTimeout(() => onNote?.(i), (0.08 + i * beat) * 1000));
  const end = setTimeout(() => onEnd?.(), (0.08 + notes.length * beat + 0.3) * 1000);
  return () => { timers.forEach(clearTimeout); clearTimeout(end); master.gain.setTargetAtTime(0, ctx.currentTime, 0.05); onEnd?.(); };
}
