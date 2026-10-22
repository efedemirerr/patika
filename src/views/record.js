import L from 'leaflet';
import { store } from '../store.js';
import { ROUTES, routeById, walkPath, elevationGain } from '../map/city.js';
import { createCityMap, routeLayer, dotMarker, fitPts } from '../map/render.js';
import { icon, km, pace, speed, clock, SPORTS, timeTitle, esc } from '../util.js';
import { sheet, closeBtn, toast } from '../ui.js';

// Simülasyon hızları (m/s): harita kurgusal olduğu için kayıt, seçilen rota üzerinde simüle edilir.
const SPEEDS = { run: 2.9, ride: 6.5, walk: 1.4 };

export function renderRecord(root, params) {
  const st = {
    sport: 'run', route: routeById(params.get('route')) || ROUTES[0], status: 'idle',
    elapsed: 0, dist: 0, lastTick: 0, timer: null, factor: 1, splitStart: { t: 0, d: 0 },
  };

  root.innerHTML = `
    <div class="map-screen record">
      <div id="map" class="map-fill"></div>
      <button class="fab back" data-back>${icon('chevDown', 26)}</button>
      <button class="promo-pill" data-fast><span class="dots"><i></i><i></i><i></i></span><div><b>Demo hızı: <em>1×</em></b><small>Simülasyonu hızlandırmak için dokun</small></div></button>
      <div class="fab-col low">
        <button class="fab" data-fit>${icon('locate')}</button>
      </div>
      <div class="rec-panel">
        <div class="gps">${icon('pulse', 20)} GPS hazır <small>(simülasyon)</small></div>
        <div class="rec-stats">
          <div><b data-v="time">00:00</b><span>Süre</span></div>
          <div><b data-v="pace">–:––</b><span data-v="paceLabel">Bölüm ort. (/km)</span></div>
          <div><b data-v="dist">0</b><span>Mesafe (km)</span></div>
        </div>
      </div>
      <div class="rec-bar">
        <div class="rec-controls"></div>
      </div>
    </div>`;

  const ctx = createCityMap(root.querySelector('#map'), { theme: store.get().mapTheme });
  const plan = L.layerGroup().addTo(ctx.map);
  const live = L.layerGroup().addTo(ctx.map);
  let me = null;
  const $ = (s) => root.querySelector(s);

  const drawPlan = () => {
    plan.clearLayers();
    L.polyline(ctx.lls(st.route.pts), { renderer: ctx.renderer, color: '#ffffff', weight: 3, opacity: 0.35, dashArray: '6 8' }).addTo(plan);
    if (!me) me = dotMarker(ctx, st.route.pts[0], 'me-dot').addTo(ctx.map);
    fitPts(ctx, st.route.pts, 70);
  };

  const controls = () => {
    const c = $('.rec-controls');
    const sp = SPORTS[st.sport];
    if (st.status === 'idle') {
      c.innerHTML = `
        <button class="side" data-sportsel><span class="round-ic">${icon(sp.icon, 30)}<i>${icon('check', 12)}</i></span>${sp.label}</button>
        <button class="big-play" data-start>${icon('play', 38)}</button>
        <button class="side" data-route><span class="round-ic gray">${icon('route', 28)}</span>Rota Ekle</button>`;
    } else if (st.status === 'running') {
      c.innerHTML = `<button class="big-play pause" data-pause>${icon('pause', 34)}</button>`;
    } else {
      c.innerHTML = `
        <button class="big-play ghost" data-resume>${icon('play', 32)}<small>Devam</small></button>
        <button class="big-play finish" data-finish>${icon('stop', 28)}<small>Bitir</small></button>`;
    }
  };

  const updateStats = () => {
    $('[data-v="time"]').textContent = clock(st.elapsed);
    $('[data-v="dist"]').textContent = km(st.dist);
    if (st.sport === 'ride') {
      $('[data-v="pace"]').textContent = speed(st.elapsed, st.dist);
      $('[data-v="paceLabel"]').textContent = 'Ort. hız (km/s)';
    } else {
      $('[data-v="pace"]').textContent = pace(st.elapsed - st.splitStart.t, st.dist - st.splitStart.d);
      $('[data-v="paceLabel"]').textContent = 'Bölüm ort. (/km)';
    }
  };

  const tick = () => {
    const now = performance.now();
    const dt = ((now - st.lastTick) / 1000) * st.factor;
    st.lastTick = now;
    st.elapsed += dt;
    // Küçük tempo dalgalanmaları
    st.dist += dt * SPEEDS[st.sport] * (0.92 + 0.16 * Math.sin(st.elapsed / 37) ** 2);
    if (Math.floor(st.dist / 1000) > Math.floor(st.splitStart.d / 1000)) st.splitStart = { t: st.elapsed, d: Math.floor(st.dist / 1000) * 1000 };
    const w = walkPath(st.route.pts, st.dist);
    me.setLatLng(ctx.ll(w.point));
    live.clearLayers();
    routeLayer(ctx, w.laps ? st.route.pts : w.traveled, { weight: 5 }).addTo(live);
    updateStats();
  };

  const start = () => {
    st.status = 'running';
    st.lastTick = performance.now();
    st.timer = setInterval(tick, 250);
    controls();
  };
  const pause = () => { clearInterval(st.timer); st.status = 'paused'; controls(); };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.back !== undefined) {
      if (st.status !== 'idle' && !confirm('Kayıt iptal edilsin mi?')) return;
      history.length > 1 ? history.back() : (location.hash = '#/home');
    }
    if (t.dataset.start !== undefined) start();
    if (t.dataset.pause !== undefined) pause();
    if (t.dataset.resume !== undefined) start();
    if (t.dataset.finish !== undefined) finish();
    if (t.dataset.fit !== undefined) fitPts(ctx, st.route.pts, 70);
    if (t.dataset.fast !== undefined) {
      st.factor = st.factor === 1 ? 10 : st.factor === 10 ? 30 : 1;
      t.querySelector('em').textContent = `${st.factor}×`;
    }
    if (t.dataset.sportsel !== undefined) {
      sheet(`${closeBtn()}<h2>Spor seç</h2><div class="sport-grid">${Object.entries(SPORTS).map(([k, v]) => `<button class="sport-opt ${k === st.sport ? 'on' : ''}" data-k="${k}">${icon(v.icon, 30)}<span>${v.label}</span></button>`).join('')}</div>`,
        (el, close) => el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { st.sport = b.dataset.k; close(); controls(); updateStats(); })));
    }
    if (t.dataset.route !== undefined) {
      sheet(`${closeBtn()}<h2>Rota seç</h2><ul class="list">${ROUTES.map((r) => `<li><button class="row-btn ${r.id === st.route.id ? 'on' : ''}" data-r="${r.id}"><b>${esc(r.name)}</b><small>${km(r.distance, 1)} km · ${r.gain} m · ${r.difficulty}</small></button></li>`).join('')}</ul>`,
        (el, close) => el.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { st.route = routeById(b.dataset.r); close(); drawPlan(); me.setLatLng(ctx.ll(st.route.pts[0])); })));
    }
  });

  function finish() {
    if (st.dist < 20) { toast('Kaydetmek için çok kısa'); return; }
    const w = walkPath(st.route.pts, st.dist);
    const path = w.laps ? st.route.pts : w.traveled;
    sheet(`<h2>Aktiviteyi kaydet</h2>
      <form class="form">
        <input name="title" class="input" value="${timeTitle(st.sport)}" />
        <textarea name="desc" class="input" rows="2" placeholder="Nasıl geçti?"></textarea>
        <label class="check"><input type="checkbox" name="private"/> Yalnızca takipçiler görebilsin</label>
        <div class="stats3"><div><span>Mesafe</span><b>${km(st.dist)} km</b></div><div><span>Süre</span><b>${clock(st.elapsed)}</b></div><div><span>Tırmanış</span><b>${Math.round(elevationGain(path) * (w.laps + 1))} m</b></div></div>
        <button class="btn primary block">Aktiviteyi kaydet</button>
        <button type="button" class="btn ghost block" data-discard>Sil</button>
      </form>`, (el, close) => {
      el.querySelector('[data-discard]').onclick = () => { close(); location.hash = '#/home'; };
      el.querySelector('form').onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const a = store.addActivity({
          userId: 'me', type: st.sport, routeId: st.route.id, path: path.filter((_, i) => i % 2 === 0 || i === path.length - 1),
          date: new Date().toISOString(), title: f.get('title') || timeTitle(st.sport), desc: f.get('desc'),
          distance: Math.round(st.dist), duration: Math.round(st.elapsed), gain: Math.round(elevationGain(path) * (w.laps + 1)),
          kudos: 0, liked: false, comments: [], private: !!f.get('private'),
        });
        close();
        toast('Aktivite kaydedildi 🎉');
        location.hash = `#/activity/${a.id}`;
      };
    });
  }

  drawPlan();
  controls();
  return () => { clearInterval(st.timer); ctx.map.remove(); };
}
