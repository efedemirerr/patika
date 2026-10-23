// Kartpostal: aktiviteden editoryal, paylaşılabilir poster (4:5). Üç şablon: Gazete, Pafta, Afiş.
import { store } from '../store.js';
import { sealSVG, INK } from './seal.js';
import { km, pace, duration, shortDate, esc, icon, upper } from '../util.js';
import { sheet, closeBtn, toast } from '../ui.js';
import { primaryStat } from '../views/common.js';
import { tr, isEn } from '../i18n.js';
import { isPlus, plusTag, premiumSheet } from './plus.js';

const W = 1080, H = 1350;
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

function routePath(pts, box) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const s = Math.min(box.w / (maxX - minX || 1), box.h / (maxY - minY || 1)) * 0.86;
  const ox = box.x + (box.w - (maxX - minX) * s) / 2, oy = box.y + (box.h - (maxY - minY) * s) / 2;
  const step = Math.max(1, Math.floor(pts.length / 500));
  return 'M' + pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map(([x, y]) => `${(ox + (x - minX) * s).toFixed(1)} ${(oy + (maxY - y) * s).toFixed(1)}`).join('L');
}

function wrap(text, max) {
  const words = text.split(/\s+/), lines = [];
  let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function contours(seed) {
  let out = '';
  for (let r = 60; r < 900; r += 46) {
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const k = r * (1 + 0.08 * Math.sin(a * 3 + seed + r / 90) + 0.05 * Math.sin(a * 5 - seed));
      pts.push(`${(760 + Math.cos(a) * k).toFixed(0)} ${(520 + Math.sin(a) * k * 0.8).toFixed(0)}`);
    }
    out += `M${pts.join('L')}Z`;
  }
  return out;
}

export function postcardSVG(a, template, title) {
  const pts = store.activityPts(a);
  const ps = primaryStat(a);
  const stats = [[tr('Mesafe'), `${km(a.distance)} km`], [tr(ps.label), ps.value], [tr('Süre'), duration(a.duration)]];
  const date = upper(shortDate(a.date));
  const lines = wrap(tr(title), template === 'poster' ? 14 : 18);

  if (template === 'gazete') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="${INK.paper}"/>
      <text x="80" y="110" font-family="${SANS}" font-size="26" letter-spacing="6" fill="${INK.ink}">${isEn ? 'MOVECIRCLE · FIELD LOG' : 'MOVECIRCLE · SAHA KAYDI'}</text>
      <text x="${W - 80}" y="110" text-anchor="end" font-family="${SANS}" font-size="26" letter-spacing="4" fill="${INK.ink}">${esc(date)}</text>
      <line x1="80" x2="${W - 80}" y1="138" y2="138" stroke="${INK.ink}" stroke-width="3"/>
      <line x1="80" x2="${W - 80}" y1="148" y2="148" stroke="${INK.ink}" stroke-width="1"/>
      ${lines.map((l, i) => `<text x="80" y="${250 + i * 96}" font-family="${SERIF}" font-size="92" font-weight="700" fill="${INK.ink}">${esc(l)}</text>`).join('')}
      <path d="${routePath(pts, { x: 80, y: 300 + lines.length * 96, w: W - 160, h: 660 - lines.length * 60 })}" fill="none" stroke="${INK.ink}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
      <line x1="80" x2="${W - 80}" y1="1130" y2="1130" stroke="${INK.ink}" stroke-width="1"/>
      ${stats.map(([l, v], i) => `<text x="${80 + i * 320}" y="1190" font-family="${SANS}" font-size="26" letter-spacing="3" fill="${INK.ink}" opacity=".7">${esc(upper(l))}</text><text x="${80 + i * 320}" y="1262" font-family="${SERIF}" font-size="64" fill="${INK.ink}">${esc(v)}</text>`).join('')}
    </svg>`;
  }

  if (template === 'pafta') {
    const grid = Array.from({ length: 9 }, (_, i) => `<line x1="${80 + i * 115}" x2="${80 + i * 115}" y1="80" y2="1080" stroke="${INK.ink}" stroke-width="1" opacity=".12"/><line x1="80" x2="1000" y1="${80 + i * 125}" y2="${80 + i * 125}" stroke="${INK.ink}" stroke-width="1" opacity=".12"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="${INK.paper}"/>
      <rect x="80" y="80" width="920" height="1000" fill="none" stroke="${INK.ink}" stroke-width="2"/>
      <clipPath id="c"><rect x="80" y="80" width="920" height="1000"/></clipPath>
      <g clip-path="url(#c)"><path d="${contours(a.distance % 7)}" fill="none" stroke="${INK.faint}" stroke-width="2"/>${grid}</g>
      <path d="${routePath(pts, { x: 120, y: 120, w: 840, h: 920 })}" fill="none" stroke="${INK.red}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
      <text x="80" y="1150" font-family="${SERIF}" font-size="56" font-style="italic" fill="${INK.ink}">${esc(lines.join(' '))}</text>
      <text x="80" y="1230" font-family="${MONO}" font-size="30" fill="${INK.ink}">${esc(stats.map(([, v]) => v).join('  ·  '))}</text>
      <text x="80" y="1290" font-family="${MONO}" font-size="24" fill="${INK.ink}" opacity=".6">${isEn ? 'SHEET' : 'PAFTA'} ${esc(a.id.slice(-4).toUpperCase())} · ${esc(date)} · ${isEn ? 'KADIKÖY · ISTANBUL' : 'KADIKÖY · İSTANBUL'}</text>
      <g transform="translate(940 1190)"><path d="M0 -40 L12 0 L0 -8 L-12 0Z" fill="${INK.ink}"/><text y="30" text-anchor="middle" font-family="${SANS}" font-size="24" fill="${INK.ink}">K</text></g>
    </svg>`;
  }

  // Afiş
  const big = km(a.distance, 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${INK.ink}"/>
    <text x="60" y="520" font-family="${SANS}" font-size="420" font-weight="900" letter-spacing="-20" fill="${INK.paper}" opacity=".08">${esc(big)}</text>
    <path d="${routePath(pts, { x: 140, y: 160, w: 800, h: 640 })}" fill="none" stroke="#c6f432" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
    <text x="80" y="960" font-family="${SANS}" font-size="200" font-weight="900" letter-spacing="-8" fill="${INK.paper}">${esc(big)}<tspan font-size="70" letter-spacing="0" dx="20">km</tspan></text>
    ${lines.map((l, i) => `<text x="80" y="${1060 + i * 64}" font-family="${SANS}" font-size="56" font-weight="700" fill="${INK.paper}">${esc(l)}</text>`).join('')}
    <text x="80" y="1290" font-family="${SANS}" font-size="28" letter-spacing="4" fill="${INK.paper}" opacity=".6">${esc(`${stats[1][1]} · ${stats[2][1]} · ${date}`)}</text>
    <circle cx="960" cy="1250" r="44" fill="none" stroke="#c6f432" stroke-width="5"/><circle cx="960" cy="1250" r="10" fill="#c6f432"/>
  </svg>`;
}

async function svgToPngBlob(svg) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    c.getContext('2d').drawImage(img, 0, 0, W, H);
    return await new Promise((res) => c.toBlob(res, 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

const TEMPLATES = [['gazete', 'Gazete'], ['pafta', 'Pafta'], ['poster', 'Afiş']];

export function postcardSheet(a) {
  let tpl = 'gazete';
  let title = tr(a.title);
  sheet(`${closeBtn()}<h2>Kartpostal</h2>
    <div class="pc-tabs">${TEMPLATES.map(([k, l]) => `<button class="chip ${k === tpl ? 'active' : ''}" data-tpl="${k}">${l}${k !== 'gazete' && !isPlus() ? plusTag('+') : ''}</button>`).join('')}</div>
    <div class="pc-preview"></div>
    <label class="pc-title">Başlık<input class="input" maxlength="48" value="${esc(title)}"/></label>
    <button class="btn primary block" data-share>${icon('share', 18)} Paylaş</button>`, (el) => {
    const prev = el.querySelector('.pc-preview');
    const draw = () => (prev.innerHTML = postcardSVG(a, tpl, title));
    el.querySelectorAll('[data-tpl]').forEach((b) => (b.onclick = () => {
      if (b.dataset.tpl !== 'gazete' && !isPlus()) return premiumSheet('postcard');
      tpl = b.dataset.tpl;
      el.querySelectorAll('[data-tpl]').forEach((x) => x.classList.toggle('active', x === b));
      draw();
    }));
    el.querySelector('input').oninput = (e) => { title = e.target.value || a.title; draw(); };
    el.querySelector('[data-share]').onclick = async () => {
      try {
        const blob = await svgToPngBlob(postcardSVG(a, tpl, title));
        const file = new File([blob], `movecircle-${a.id}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title });
        else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = file.name;
          link.click();
          setTimeout(() => URL.revokeObjectURL(link.href), 2000);
          toast('Kartpostal indirildi');
        }
      } catch (err) { if (err?.name !== 'AbortError') toast('Paylaşılamadı'); }
    };
    draw();
  }, { full: true });
}

export function sealSheet(a) {
  const pts = store.activityPts(a);
  sheet(`${closeBtn()}<h2>Rota Mührü</h2>
    <div class="seal-wrap">${sealSVG(a, pts, { animate: true })}</div>
    <p class="seal-cap">${esc(a.title)} · ${km(a.distance)} km · ${pace(a.duration, a.distance)} /km</p>
    <p class="muted small">Halkalar km'leri gösterir: kalın halka hızlı km, kırmızı halka en hızlı km.</p>
    <button class="btn primary block" data-pc>Kartpostal yap</button>`, (el, close) => {
    el.querySelector('[data-pc]').onclick = () => { close(); setTimeout(() => postcardSheet(a), 260); };
  });
}
