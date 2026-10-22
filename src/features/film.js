// Koşu Filmi: aktivitenin eğik açılı, tempoya göre hızlanan 20 saniyelik tekrarı. Son karede Rota Mührü'ne dönüşür.
import L from 'leaflet';
import { store } from '../store.js';
import { walkPath, pathLength } from '../map/city.js';
import { createCityMap, routeLayer, fitPts } from '../map/render.js';
import { splitTimes, sealSVG } from './seal.js';
import { icon, km, pace, clock, esc } from '../util.js';
import { postcardSheet } from './postcard.js';

const FILM_SECONDS = 20;

export function openFilm(a, { onClose } = {}) {
  const pts = store.activityPts(a);
  const total = pathLength(pts);
  const splits = splitTimes(a);
  // Film zamanı km başına tempoyla orantılı: hızlı km'ler daha kısa sürer, kamera hızlanır.
  const weights = splits.map((s) => s.sec);
  const wsum = weights.reduce((s, w) => s + w, 0) || 1;
  const seg = []; // {f0,f1,d0,d1,t0,t1}
  let f = 0, d = 0, t = 0;
  splits.forEach((s, i) => {
    const df = (weights[i] / wsum) * FILM_SECONDS;
    const dd = (s.meters / a.distance) * total;
    seg.push({ f0: f, f1: f + df, d0: d, d1: d + dd, t0: t, t1: t + s.sec, km: s.km, sec: s.sec, meters: s.meters });
    f += df; d += dd; t += s.sec;
  });
  const at = (ft) => {
    const s = seg.find((x) => ft <= x.f1) || seg[seg.length - 1];
    const k = Math.min(1, Math.max(0, (ft - s.f0) / (s.f1 - s.f0 || 1)));
    return { dist: s.d0 + (s.d1 - s.d0) * k, time: s.t0 + (s.t1 - s.t0) * k, s };
  };

  const wrap = document.createElement('div');
  wrap.className = 'film';
  wrap.innerHTML = `
    <div class="film-stage"><div class="film-map"></div></div>
    <div class="film-vignette"></div>
    <div class="film-top">
      <div><b>${esc(a.title)}</b><small>Koşu Filmi</small></div>
      <div class="film-btns"><button class="pill-btn" data-speed>1×</button><button class="icon-btn round dark" data-close>${icon('close', 22)}</button></div>
    </div>
    <div class="film-end"></div>
    <div class="film-strip">
      <div class="film-stats"><div><b data-v="tc">00:00</b><span>Zaman</span></div><div><b data-v="km">0,00</b><span>km</span></div><div><b data-v="pace">–:––</b><span>/km</span></div></div>
      <input type="range" min="0" max="1000" value="0" class="film-scrub" aria-label="Filmde gezin"/>
    </div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));

  const mapEl = wrap.querySelector('.film-map');
  const ctx = createCityMap(mapEl, { static: true, theme: 'dark', mini: true });
  ctx.map.setZoom(1.75, { animate: false });
  const ghost = L.polyline(ctx.lls(pts), { renderer: ctx.renderer, color: '#ffffff', weight: 2, opacity: 0.25, dashArray: '4 6' }).addTo(ctx.map);
  const trail = L.layerGroup().addTo(ctx.map);
  const head = L.circleMarker(ctx.ll(pts[0]), { renderer: ctx.renderer, radius: 7, color: '#fff', weight: 3, fillColor: '#c6f432', fillOpacity: 1 }).addTo(ctx.map);
  ctx.map.setView(ctx.ll(pts[0]), 1.75, { animate: false });

  const $ = (s) => wrap.querySelector(s);
  let ft = 0, playing = true, speed = 1, last = performance.now(), raf = 0, ended = false;

  const render = () => {
    const { dist, time, s } = at(ft);
    const w = walkPath(pts, dist);
    trail.clearLayers();
    routeLayer(ctx, w.traveled.length > 1 ? w.traveled : [pts[0], pts[0]], { weight: 5 }).addTo(trail);
    head.setLatLng(ctx.ll(w.point));
    ctx.map.setView(ctx.ll(w.point), 1.75, { animate: false });
    $('[data-v="tc"]').textContent = clock(time);
    $('[data-v="km"]').textContent = km((dist / total) * a.distance);
    $('[data-v="pace"]').textContent = pace(s.sec, s.meters);
    $('.film-scrub').value = String(Math.round((ft / FILM_SECONDS) * 1000));
  };

  const finish = () => {
    ended = true; playing = false;
    trail.clearLayers();
    routeLayer(ctx, pts, { weight: 5 }).addTo(trail);
    ghost.remove();
    wrap.classList.add('zoomed');
    setTimeout(() => fitPts(ctx, pts, 60), 50);
    setTimeout(() => {
      $('.film-end').innerHTML = `<div class="film-seal">${sealSVG(a, pts, { animate: true, size: 280 })}</div>
        <div class="film-end-btns"><button class="btn outline" data-replay>Tekrar oynat</button><button class="btn primary" data-card>Kartpostal yap</button></div>`;
      wrap.classList.add('ended');
    }, 900);
  };

  const loop = (now) => {
    const dt = (now - last) / 1000; last = now;
    if (playing && !ended) {
      ft = Math.min(FILM_SECONDS, ft + dt * speed);
      render();
      if (ft >= FILM_SECONDS) finish();
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const close = () => {
    cancelAnimationFrame(raf);
    wrap.classList.remove('open');
    setTimeout(() => { ctx.map.remove(); wrap.remove(); onClose?.(); }, 250);
  };

  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b?.dataset.close !== undefined) return close();
    if (b?.dataset.speed !== undefined) { speed = speed === 1 ? 2 : 1; b.textContent = `${speed}×`; return; }
    if (b?.dataset.replay !== undefined) {
      ended = false; playing = true; ft = 0; wrap.classList.remove('ended', 'zoomed'); $('.film-end').innerHTML = '';
      ghost.addTo(ctx.map); return;
    }
    if (b?.dataset.card !== undefined) { close(); setTimeout(() => postcardSheet(a), 300); return; }
    if (e.target.closest('.film-stage, .film-vignette') && !ended) playing = !playing;
    wrap.classList.toggle('paused', !playing && !ended);
  });
  $('.film-scrub').addEventListener('input', (e) => {
    if (ended) { ended = false; wrap.classList.remove('ended', 'zoomed'); $('.film-end').innerHTML = ''; ghost.addTo(ctx.map); }
    playing = false; wrap.classList.add('paused');
    ft = (Number(e.target.value) / 1000) * FILM_SECONDS;
    render();
  });
  render();
  return close;
}
