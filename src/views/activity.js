import L from 'leaflet';
import { store } from '../store.js';
import { createCityMap, routeLayer, dotMarker, fitPts } from '../map/render.js';
import { icon, avatar, esc, km, pace, duration, longDate, SPORTS, upper } from '../util.js';
import { tr } from '../i18n.js';
import { primaryStat, shareSheet } from './common.js';
import { toast } from '../ui.js';
import { splitTimes, sealSVG } from '../features/seal.js';
import { sealSheet, postcardSheet } from '../features/postcard.js';
import { openFilm } from '../features/film.js';
import { silhouetteSVG } from '../features/character.js';
import { countUp, frameMarks } from '../features/motion.js';
import { coordLabel } from './common.js';
import { rhythmData, staffSVG, playRhythm } from '../features/rhythm.js';
import { capsules, capsuleMarker, dropCapsuleSheet } from '../features/capsule.js';

export function renderActivity(root, params, id) {
  const a = store.activity(id);
  if (!a) { root.innerHTML = '<p class="muted center pad">Aktivite bulunamadı.</p>'; return; }
  const u = store.user(a.userId);
  const pts = store.activityPts(a);
  let cleanup = () => {};
  let stopPlay = null, dropMode = false;
  const setDrop = (v) => { dropMode = v; root.querySelector('.detail-map')?.classList.toggle('dropping', v); };
  let closeFilm = null;

  const draw = () => {
    const ps = primaryStat(a);
    root.innerHTML = `
      <div class="detail-map framed"><div id="map" class="map-fill"></div>${frameMarks(upper(tr(SPORTS[a.type].label)), coordLabel(pts[0]))}
        <button class="fab back" data-back>${icon('chevLeft', 26)}</button>
        <button class="cap-cta" data-capdrop>${icon('pin', 16)} Kapsül bırak</button>
        <button class="film-cta" data-film>${icon('play', 18)} Koşu Filmi</button></div>
      <div class="detail">
        <header class="act-head">${avatar(u)}<div><div class="act-user">${esc(u.name)}</div><div class="act-meta">${icon(SPORTS[a.type].icon, 16)} ${longDate(a.date)}</div></div></header>
        <h1>${esc(a.title)}</h1>
        ${a.desc ? `<p>${esc(a.desc)}</p>` : ''}
        <div class="grid-stats">
          <div><span>Mesafe</span><b><i data-count="${a.distance}" data-fmt="km">0</i> km</b></div>
          <div><span>${ps.label}</span><b>${ps.value}</b></div>
          <div><span>Süre</span><b>${duration(a.duration)}</b></div>
          <div><span>Tırmanış</span><b><i data-count="${a.gain}">0</i> m</b></div>
          <div><span>Kalori</span><b data-count="${Math.round((a.distance / 1000) * (a.type === 'ride' ? 28 : 62))}">0</b></div>
          <div><span>Beğeni</span><b>${a.kudos}</b></div>
        </div>
        <button class="seal-row" data-seal>
          <span class="seal-thumb">${sealSVG(a, pts, { size: 120 })}</span>
          <span><b>Rota Mührü</b><small>Bu koşudan üretilen tekil işaret. Kartpostala dönüştür ve paylaş.</small></span>
          ${icon('chevRight', 20)}
        </button>
        <section class="rhythm card">
          <div class="rhythm-head"><div><b>Ritim Partisyonu</b><small>Her km bir nota: hızlı km yüksek, yavaş km alçak.</small></div>
          <button class="btn primary sm" data-play>${icon('play', 14)} Dinle</button></div>
          <div class="staff-wrap">${staffSVG(rhythmData(a))}</div>
        </section>
        <h3>Yükselti silueti</h3><div class="sil">${silhouetteSVG(pts)}</div>
        ${a.type !== 'ride' ? `<h3>Bölümler</h3>${splits(a)}` : ''}
        <div class="act-actions">
          <button class="icon-btn ${a.liked ? 'liked' : ''}" data-like>${icon('like', 26)}</button>
          <button class="icon-btn" data-postcard aria-label="Kartpostal">${icon('stats', 26)}</button>
          <button class="icon-btn" data-share>${icon('share', 26)}</button>
          ${a.userId === 'me' ? `<button class="icon-btn" data-del>${icon('trash', 26)}</button>` : ''}
        </div>
        <h3>Yorumlar</h3>
        <ul class="list comments">${a.comments.map((c) => `<li>${avatar(store.user(c.userId), 34)}<div><b>${esc(store.user(c.userId).name)}</b>${esc(c.text)}</div></li>`).join('') || '<li class="muted">Henüz yorum yok</li>'}</ul>
        <form class="comment-form"><input class="input" name="c" placeholder="Yorum ekle…"/><button class="btn primary sm">Gönder</button></form>
      </div>`;
    const ctx = createCityMap(root.querySelector('#map'), { static: false, theme: store.get().mapTheme });
    routeLayer(ctx, pts, { weight: 5 }).addTo(ctx.map);
    dotMarker(ctx, pts[0], 'dot-start').addTo(ctx.map);
    dotMarker(ctx, pts[pts.length - 1], 'dot-end').addTo(ctx.map);
    fitPts(ctx, pts, 40);
    countUp(root.querySelector('.grid-stats'));
    const capLayer = L.layerGroup().addTo(ctx.map);
    const drawCaps = () => { capLayer.clearLayers(); capsules().forEach((c) => capsuleMarker(ctx, c).addTo(capLayer)); };
    drawCaps();
    ctx.map.on('click', (e) => {
      if (!dropMode) return;
      // Dokunulan yere en yakın rota noktasına kapsül bırak
      const p = ctx.xy(e.latlng);
      const near = pts.reduce((b, q) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(b[0] - p[0], b[1] - p[1]) ? q : b), pts[0]);
      setDrop(false);
      dropCapsuleSheet(near, drawCaps);
    });
    cleanup = () => ctx.map.remove();
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.back !== undefined) history.length > 1 ? history.back() : (location.hash = '#/home');
    if (t.dataset.like !== undefined) { store.update(() => { a.liked = !a.liked; a.kudos += a.liked ? 1 : -1; }); redraw(); }
    if (t.dataset.share !== undefined) shareSheet();
    if (t.dataset.film !== undefined) closeFilm = openFilm(a, { onClose: () => (closeFilm = null) });
    if (t.dataset.seal !== undefined) sealSheet(a);
    if (t.dataset.capdrop !== undefined) { setDrop(!dropMode); if (dropMode) toast('Kapsülü bırakmak için rotada bir noktaya dokun'); }
    if (t.dataset.play !== undefined) {
      if (stopPlay) { stopPlay(); return; }
      const notes = rhythmData(a);
      const svg = root.querySelector('.staff');
      t.innerHTML = `${icon('pause', 14)} Durdur`;
      stopPlay = playRhythm(notes, (i) => {
        svg.querySelectorAll('.note').forEach((n) => n.classList.toggle('on', Number(n.dataset.i) === i));
        const nt = svg.querySelector(`.note[data-i="${i}"]`);
        nt?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, () => { stopPlay = null; svg.querySelectorAll('.note').forEach((n) => n.classList.remove('on')); t.innerHTML = `${icon('play', 14)} Dinle`; });
    }
    if (t.dataset.postcard !== undefined) postcardSheet(a);
    if (t.dataset.del !== undefined && confirm('Aktivite silinsin mi?')) {
      store.update((s) => (s.activities = s.activities.filter((x) => x.id !== a.id)));
      toast('Aktivite silindi'); location.hash = '#/you/acts';
    }
  });
  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = new FormData(e.target).get('c').trim();
    if (!text) return;
    store.update(() => a.comments.push({ userId: 'me', text }));
    redraw();
  });
  const redraw = () => { cleanup(); draw(); };
  draw();
  // Kayıttan hemen sonra film kendiliğinden oynar
  if (params.get('film')) {
    history.replaceState(null, '', `#/activity/${a.id}`);
    setTimeout(() => (closeFilm = openFilm(a, { onClose: () => (closeFilm = null) })), 350);
  }
  return () => { closeFilm?.(); stopPlay?.(); cleanup(); };
}

function splits(a) {
  const list = splitTimes(a).filter((s) => s.meters >= 1000);
  if (!list.length) return '<p class="muted">1 km\'den kısa</p>';
  const paces = list.map((s) => s.sec);
  const fastest = Math.min(...paces);
  const rows = list.slice(0, 30).map((s) => {
    const w = Math.min(100, (fastest / s.sec) * 100);
    return `<tr><td>${s.km}</td><td>${pace(s.sec, 1000)}</td><td><i class="sbar ${s.sec === fastest ? 'best' : ''}" style="width:${w}%"></i></td></tr>`;
  }).join('');
  return `<table class="table splits"><thead><tr><th>km</th><th>Tempo</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}
