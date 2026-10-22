import L from 'leaflet';
import { store } from '../store.js';
import { elevation, pathLength } from '../map/city.js';
import { createCityMap, routeLayer, dotMarker, fitPts } from '../map/render.js';
import { icon, avatar, esc, km, pace, duration, longDate, SPORTS } from '../util.js';
import { primaryStat, shareSheet } from './common.js';
import { toast } from '../ui.js';

export function renderActivity(root, params, id) {
  const a = store.activity(id);
  if (!a) { root.innerHTML = '<p class="muted center pad">Aktivite bulunamadı.</p>'; return; }
  const u = store.user(a.userId);
  const pts = store.activityPts(a);

  const draw = () => {
    const ps = primaryStat(a);
    root.innerHTML = `
      <div class="detail-map"><div id="map" class="map-fill"></div>
        <button class="fab back" data-back>${icon('chevLeft', 26)}</button></div>
      <div class="detail">
        <header class="act-head">${avatar(u)}<div><div class="act-user">${esc(u.name)}</div><div class="act-meta">${icon(SPORTS[a.type].icon, 16)} ${longDate(a.date)}</div></div></header>
        <h1>${esc(a.title)}</h1>
        ${a.desc ? `<p>${esc(a.desc)}</p>` : ''}
        <div class="grid-stats">
          <div><span>Mesafe</span><b>${km(a.distance)} km</b></div>
          <div><span>${ps.label}</span><b>${ps.value}</b></div>
          <div><span>Süre</span><b>${duration(a.duration)}</b></div>
          <div><span>Tırmanış</span><b>${a.gain} m</b></div>
          <div><span>Kalori</span><b>${Math.round((a.distance / 1000) * (a.type === 'ride' ? 28 : 62))}</b></div>
          <div><span>Beğeni</span><b>${a.kudos}</b></div>
        </div>
        <h3>İrtifa</h3>${elevChart(pts)}
        ${a.type !== 'ride' ? `<h3>Bölümler</h3>${splits(a)}` : ''}
        <div class="act-actions">
          <button class="icon-btn ${a.liked ? 'liked' : ''}" data-like>${icon('like', 26)}</button>
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
    cleanup = () => ctx.map.remove();
  };
  let cleanup = () => {};

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.back !== undefined) history.length > 1 ? history.back() : (location.hash = '#/home');
    if (t.dataset.like !== undefined) { store.update(() => { a.liked = !a.liked; a.kudos += a.liked ? 1 : -1; }); redraw(); }
    if (t.dataset.share !== undefined) shareSheet();
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
  return () => cleanup();
}

function elevChart(pts) {
  const W = 320, H = 90;
  const step = Math.max(1, Math.floor(pts.length / 80));
  const s = pts.filter((_, i) => i % step === 0).map((p) => elevation(...p));
  const max = Math.max(...s) + 5, min = Math.max(0, Math.min(...s) - 5);
  const xy = s.map((v, i) => `${((i / (s.length - 1)) * W).toFixed(1)},${(H - ((v - min) / (max - min || 1)) * (H - 10)).toFixed(1)}`);
  return `<svg class="chart elev" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="M0,${H} L${xy.join(' L')} L${W},${H}Z" fill="#c6f43233"/><polyline points="${xy.join(' ')}" fill="none" stroke="#c6f432" stroke-width="2"/></svg><small class="muted">${min}–${max} m</small>`;
}

function splits(a) {
  const n = Math.floor(a.distance / 1000);
  if (!n) return '<p class="muted">1 km\'den kısa</p>';
  const avg = a.duration / (a.distance / 1000);
  const rows = Array.from({ length: Math.min(n, 30) }, (_, i) => {
    const t = avg * (0.94 + 0.12 * Math.abs(Math.sin(i * 1.7 + a.distance)));
    const w = Math.min(100, (avg / t) * 80);
    return `<tr><td>${i + 1}</td><td>${pace(t, 1000)}</td><td><i class="sbar" style="width:${w}%"></i></td></tr>`;
  }).join('');
  return `<table class="table splits"><thead><tr><th>km</th><th>Tempo</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}
