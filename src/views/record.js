import L from 'leaflet';
import { store } from '../store.js';
import { ROUTES, routeById, walkPath, elevationGain, fromLatLng, inArea, METERS_PER_UNIT } from '../map/city.js';
import { createCityMap, routeLayer, dotMarker, fitPts } from '../map/render.js';
import { icon, km, pace, speed, clock, SPORTS, timeTitle, esc } from '../util.js';
import { sheet, closeBtn, toast } from '../ui.js';
import { freezePalette } from '../features/palette.js';
import { isPlus, plusTag, premiumSheet } from '../features/plus.js';
import { capsules, capsuleMarker, nearbySealed, openCapsuleSheet } from '../features/capsule.js';

// Simülasyon hızları (m/s): harita kurgusal olduğu için kayıt, seçilen rota üzerinde simüle edilir.
const SPEEDS = { run: 2.9, ride: 6.5, walk: 1.4 };

export function renderRecord(root, params) {
  const st = {
    sport: 'run', route: routeById(params.get('route')) || ROUTES[0], status: 'idle',
    elapsed: 0, dist: 0, lastTick: 0, timer: null, factor: 1, splitStart: { t: 0, d: 0 },
    ghostOn: isPlus(), ghost: null,
    mode: 'sim', track: [], watch: null, lastFix: null, acc: null, warnedOut: false,
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
        <div class="gps-row"><div class="gps"><span class="gps-bars"><i></i><i></i><i></i><i></i></span> <span data-v="gps">GPS hazır</span> <small data-v="gpsSub"></small></div>
          <div class="mode-seg"><button class="on" data-mode="sim">Simülasyon</button><button data-mode="gps">Gerçek GPS</button></div></div>
        <div class="rec-stats">
          <div><b data-v="time">00:00</b><span>Süre</span></div>
          <div><b data-v="pace">–:––</b><span data-v="paceLabel">Bölüm ort. (/km)</span></div>
          <div><b data-v="dist">0</b><span>Mesafe (km)</span></div>
        </div>
        <div class="ghost-row" hidden><span class="ghost-ic"></span><b data-v="ghost">Gölge seninle aynı hizada</b></div>
      </div>
      <div class="rec-bar">
        <div class="ghost-toggle-wrap"></div>
        <div class="rec-controls"></div>
      </div>
    </div>`;

  const ctx = createCityMap(root.querySelector('#map'), { theme: store.get().mapTheme });
  const plan = L.layerGroup().addTo(ctx.map);
  const live = L.layerGroup().addTo(ctx.map);
  let me = null, ghostMk = null;
  const caps = L.layerGroup().addTo(ctx.map);
  const drawCaps = () => { caps.clearLayers(); capsules().forEach((c) => capsuleMarker(ctx, c).addTo(caps)); };
  // En iyi geçmiş koşu = gölge
  const findGhost = () => {
    const prev = store.myActivities().filter((a) => a.routeId === st.route.id && a.type === st.sport && a.distance > 300);
    if (!prev.length) return null;
    const best = prev.reduce((b, a) => (a.duration / a.distance < b.duration / b.distance ? a : b));
    return { act: best, speed: best.distance / best.duration };
  };
  const $ = (s) => root.querySelector(s);

  const drawPlan = () => {
    plan.clearLayers();
    L.polyline(ctx.lls(st.route.pts), { renderer: ctx.renderer, color: '#ffffff', weight: 3, opacity: 0.35, dashArray: '6 8' }).addTo(plan);
    if (!me) me = L.marker(ctx.ll(st.route.pts[0]), { icon: L.divIcon({ className: 'me-live', html: '<i></i><i></i><b></b>', iconSize: [22, 22] }) }).addTo(ctx.map);
    fitPts(ctx, st.route.pts, 70);
    st.ghost = findGhost();
    if (ghostMk) { ghostMk.remove(); ghostMk = null; }
    if (st.ghost && st.ghostOn) ghostMk = L.marker(ctx.ll(st.route.pts[0]), { icon: L.divIcon({ className: 'ghost-dot', html: '<b></b>', iconSize: [20, 20] }) }).addTo(ctx.map);
    drawCaps();
  };

  const controls = () => {
    const c = $('.rec-controls');
    const sp = SPORTS[st.sport];
    const gw = $('.ghost-toggle-wrap');
    gw.innerHTML = st.status === 'idle' && st.ghost
      ? `<button class="ghost-toggle ${st.ghostOn ? 'on' : ''} ${isPlus() ? '' : 'locked'}" data-ghost><span class="ghost-ic"></span><span><b>Gölgemle koş ${isPlus() ? '' : plusTag()}</b><small>${esc(st.ghost.act.title)} · ${pace(st.ghost.act.duration, st.ghost.act.distance)} /km</small></span><i></i></button>`
      : '';
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
    if (st.mode === 'gps') {
      st.elapsed += (now - st.lastTick) / 1000; st.lastTick = now;
      if (Math.floor(st.dist / 1000) > Math.floor(st.splitStart.d / 1000)) st.splitStart = { t: st.elapsed, d: Math.floor(st.dist / 1000) * 1000 };
      if (ghostMk && st.ghost) ghostStep();
      updateStats();
      return;
    }
    const dt = ((now - st.lastTick) / 1000) * st.factor;
    st.lastTick = now;
    st.elapsed += dt;
    // Küçük tempo dalgalanmaları
    st.dist += dt * SPEEDS[st.sport] * (0.92 + 0.16 * Math.sin(st.elapsed / 37) ** 2);
    if (Math.floor(st.dist / 1000) > Math.floor(st.splitStart.d / 1000)) st.splitStart = { t: st.elapsed, d: Math.floor(st.dist / 1000) * 1000 };
    const w = walkPath(st.route.pts, st.dist);
    me.setLatLng(ctx.ll(w.point));
    if (ghostMk && st.ghost) ghostStep();
    const cap = nearbySealed(w.point);
    if (cap) { pause(); openCapsuleSheet(cap); drawCaps(); }
    live.clearLayers();
    routeLayer(ctx, w.laps ? st.route.pts : w.traveled, { weight: 5 }).addTo(live);
    updateStats();
  };

  const ghostStep = () => {
    {
      const gd = st.elapsed * st.ghost.speed;
      ghostMk.setLatLng(ctx.ll(walkPath(st.route.pts, gd).point));
      // Aynı mesafeye gölge kaç saniyede ulaşırdı?
      const delta = Math.round(st.elapsed - st.dist / st.ghost.speed);
      const row = $('.ghost-row'); row.hidden = false;
      row.classList.toggle('ahead', delta < 0); row.classList.toggle('behind', delta > 0);
      $('[data-v="ghost"]').textContent = Math.abs(delta) < 2 ? 'Gölge seninle aynı hizada' : delta < 0 ? `Gölgenin ${Math.abs(delta)} sn önündesin` : `Gölgenin ${delta} sn gerisindesin`;
    }
  };

  // ---------- Gerçek GPS ----------
  const gpsLabel = (main, sub2) => { $('[data-v="gps"]').textContent = main; $('[data-v="gpsSub"]').textContent = sub2; };
  const onFix = (pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    st.acc = accuracy;
    gpsLabel(accuracy <= 25 ? 'GPS güçlü' : accuracy <= 60 ? 'GPS orta' : 'GPS zayıf', `(±${Math.round(accuracy)} m)`);
    root.querySelector('.gps').dataset.q = accuracy <= 25 ? '4' : accuracy <= 60 ? '2' : '1';
    const p = fromLatLng(latitude, longitude);
    if (inArea(p)) me.setLatLng(ctx.ll(p));
    else if (!st.warnedOut) { st.warnedOut = true; toast('Harita Kadıköy bölgesini gösteriyor; kayıt yine de doğru ölçülür'); }
    if (st.status !== 'running' || accuracy > 60) return;
    if (st.lastFix) {
      const d = Math.hypot(p[0] - st.lastFix[0], p[1] - st.lastFix[1]) * METERS_PER_UNIT;
      if (d < Math.max(3, accuracy / 4)) return; // titremeyi yok say
      st.dist += d;
    }
    st.lastFix = p; st.track.push(p);
    const cap = nearbySealed(p);
    if (cap) { pause(); openCapsuleSheet(cap); drawCaps(); }
    live.clearLayers();
    if (st.track.length > 1) routeLayer(ctx, st.track, { weight: 5 }).addTo(live);
    if (inArea(p)) ctx.map.panTo(ctx.ll(p), { animate: true });
  };
  const onGpsErr = (err) => {
    gpsLabel(err.code === 1 ? 'Konum izni yok' : 'Konum alınamadı', err.code === 1 ? '(ayarlardan izin ver)' : '(tekrar deneniyor)');
    if (err.code === 1) { toast('Gerçek GPS için konum iznine izin ver'); setMode('sim'); }
  };
  const watchOn = () => {
    if (st.watch != null || !navigator.geolocation) return;
    st.watch = navigator.geolocation.watchPosition(onFix, onGpsErr, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 });
  };
  const watchOff = () => { if (st.watch != null) navigator.geolocation.clearWatch(st.watch); st.watch = null; };
  const setMode = (m) => {
    if (st.status !== 'idle') return toast('Mod, kayıt başlamadan değiştirilebilir');
    if (m === 'gps' && !navigator.geolocation) return toast('Bu cihaz konum desteklemiyor');
    st.mode = m;
    root.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
    $('.promo-pill').hidden = m === 'gps';
    if (m === 'gps') { gpsLabel('Konum bekleniyor…', ''); watchOn(); }
    else { watchOff(); gpsLabel('GPS hazır', ''); delete root.querySelector('.gps').dataset.q; me.setLatLng(ctx.ll(st.route.pts[0])); }
  };

  const start = () => {
    freezePalette(true);
    st.status = 'running';
    st.lastTick = performance.now();
    if (st.mode === 'gps') { st.lastFix = null; watchOn(); }
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
    if (t.dataset.ghost !== undefined && !isPlus()) return premiumSheet('ghost');
    if (t.dataset.ghost !== undefined) { st.ghostOn = !st.ghostOn; drawPlan(); controls(); }
    if (t.dataset.start !== undefined) start();
    if (t.dataset.pause !== undefined) pause();
    if (t.dataset.resume !== undefined) start();
    if (t.dataset.finish !== undefined) finish();
    if (t.dataset.mode) setMode(t.dataset.mode);
    if (t.dataset.fit !== undefined) fitPts(ctx, st.route.pts, 70);
    if (t.dataset.fast !== undefined) {
      st.factor = st.factor === 1 ? 10 : st.factor === 10 ? 30 : 1;
      t.querySelector('em').textContent = `${st.factor}×`;
    }
    if (t.dataset.sportsel !== undefined) {
      sheet(`${closeBtn()}<h2>Spor seç</h2><div class="sport-grid">${Object.entries(SPORTS).map(([k, v]) => `<button class="sport-opt ${k === st.sport ? 'on' : ''}" data-k="${k}">${icon(v.icon, 30)}<span>${v.label}</span></button>`).join('')}</div>`,
        (el, close) => el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { st.sport = b.dataset.k; close(); drawPlan(); controls(); updateStats(); })));
    }
    if (t.dataset.route !== undefined) {
      sheet(`${closeBtn()}<h2>Rota seç</h2><ul class="list">${ROUTES.map((r) => `<li><button class="row-btn ${r.id === st.route.id ? 'on' : ''}" data-r="${r.id}"><b>${esc(r.name)}</b><small>${km(r.distance, 1)} km · ${r.gain} m · ${r.difficulty}</small></button></li>`).join('')}</ul>`,
        (el, close) => el.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { st.route = routeById(b.dataset.r); close(); drawPlan(); me.setLatLng(ctx.ll(st.route.pts[0])); })));
    }
  });

  function finish() {
    if (st.dist < 20) { toast('Kaydetmek için çok kısa'); return; }
    const gps = st.mode === 'gps';
    const w = gps ? { laps: 0 } : walkPath(st.route.pts, st.dist);
    const path = gps ? (st.track.length > 1 ? st.track : [st.track[0] || [0, 0], st.track[0] || [0, 0]]) : w.laps ? st.route.pts : w.traveled;
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
          userId: 'me', type: st.sport, routeId: gps ? null : st.route.id, gps, path: path.filter((_, i) => i % 2 === 0 || i === path.length - 1),
          date: new Date().toISOString(), title: f.get('title') || timeTitle(st.sport), desc: f.get('desc'),
          distance: Math.round(st.dist), duration: Math.round(st.elapsed), gain: Math.round(elevationGain(path) * (w.laps + 1)),
          kudos: 0, liked: false, comments: [], private: !!f.get('private'),
        });
        close();
        toast('Aktivite kaydedildi 🎉');
        location.hash = `#/activity/${a.id}?film=1`;
      };
    });
  }

  drawPlan();
  controls();
  return () => { clearInterval(st.timer); watchOff(); freezePalette(false); ctx.map.remove(); };
}
