import L from 'leaflet';
import { store } from '../store.js';
import { ROUTES } from '../map/city.js';
import { createCityMap, routeLayer, pinMarker, fitPts, miniMapSVG, accentColor } from '../map/render.js';
import { icon, km, esc, SPORTS, shortDate, AY_KISA } from '../util.js';
import { toast, sheet, closeBtn } from '../ui.js';
import { routeCharacter, TRAITS, MOODS, traitGlyph, maskRuns, silhouetteSVG } from '../features/character.js';

const LENGTHS = [
  { label: 'Uzunluk', test: () => true },
  { label: '< 5 km', test: (r) => r.distance < 5000 },
  { label: '5–10 km', test: (r) => r.distance >= 5000 && r.distance <= 10000 },
  { label: '> 10 km', test: (r) => r.distance > 10000 },
];
const DIFFS = ['Zorluk', 'Kolay', 'Orta', 'Zor'];
const SURFACES = ['Zemin', 'Asfalt', 'Toprak', 'Karışık'];

export function renderMaps(root, params) {
  const f = { len: 0, diff: 0, surf: 0, sort: false, saved: false, mood: 'all', atlas: params?.get('atlas') === '1' };
  root.innerHTML = `
    <div class="map-screen">
      <div id="map" class="map-fill"></div>
      <div class="map-top">
        <div class="searchbar">
          <button class="sport-pick" data-sport>${icon(SPORTS.run.icon, 24)}${icon('chevDown', 18)}</button>
          <input placeholder="Rota ara" />
          <button class="saved-btn" data-saved>${icon('bookmark', 18)} Kaydedilenler</button>
        </div>
        <div class="chips">
          <button class="chip atlas-chip" data-c="atlas">${icon('layers', 16)} Atlas</button>
          <button class="chip" data-c="routes">Rotalar</button>
          <button class="chip" data-c="len">Uzunluk</button>
          <button class="chip" data-c="diff">Zorluk</button>
          <button class="chip" data-c="elev">İrtifa</button>
          <button class="chip" data-c="surf">Zemin</button>
        </div>
        <div class="chips mood-row"><span class="mood-label">Nasıl hissetmek istiyorsun?</span>${MOODS.map((m) => `<button class="chip sm" data-mood="${m.key}">${m.label}</button>`).join('')}</div>
      </div>
      <div class="fab-col">
        <button class="fab" data-layers>${icon('layers')}<i>2</i></button>
        <button class="fab" data-3d><b>3D</b></button>
        <button class="fab" data-locate>${icon('locate')}</button>
      </div>
      <div class="route-carousel"></div>
      <div class="atlas-panel"></div>
    </div>`;

  const ctx = createCityMap(root.querySelector('#map'), { theme: store.get().mapTheme });
  const layer = L.layerGroup().addTo(ctx.map);
  const hl = L.layerGroup().addTo(ctx.map);
  const input = root.querySelector('input');
  const carousel = root.querySelector('.route-carousel');
  const atlasPanel = root.querySelector('.atlas-panel');
  let selected = null;

  // ---------- Rotalar ----------
  const filtered = () => {
    let list = ROUTES.filter((r) =>
      LENGTHS[f.len].test(r) && (!f.diff || r.difficulty === DIFFS[f.diff]) && (!f.surf || r.surface === SURFACES[f.surf]) &&
      (!f.saved || store.get().savedRoutes.includes(r.id)) && r.name.toLocaleLowerCase('tr').includes(input.value.toLocaleLowerCase('tr').trim()));
    const mood = MOODS.find((m) => m.key === f.mood);
    if (f.mood !== 'all') list = [...list].sort((a, b) => mood.score(routeCharacter(b)) - mood.score(routeCharacter(a)));
    else if (f.sort) list = [...list].sort((a, b) => b.gain - a.gain);
    return list;
  };

  const card = (r, saved) => {
    const c = routeCharacter(r);
    return `
      <div class="route-card ${r.id === selected ? 'sel' : ''}" data-r="${r.id}">
        <div class="rc-map">${miniMapSVG(r.pts, { aspect: 120 / 168 })}</div>
        <div class="rc-body">
          <b>${esc(r.name)}</b>
          <div class="traits">${TRAITS.map((t) => `<button class="trait-btn" data-trait="${t.key}" data-route="${r.id}" title="${c[t.key].text}">${traitGlyph(t, c[t.key].lvl)}<small>${t.label}</small></button>`).join('')}</div>
          <em>${km(r.distance, 1)} km · ${r.gain} m · ${r.difficulty}</em>
        </div>
        <button class="bm ${saved.includes(r.id) ? 'on' : ''}" data-bm="${r.id}">${icon('bookmark', 20)}</button>
      </div>`;
  };

  const drawRoutes = () => {
    const list = filtered();
    if (!list.find((r) => r.id === selected)) selected = list[0]?.id || null;
    layer.clearLayers(); hl.clearLayers();
    list.forEach((r) => {
      if (r.id === selected) routeLayer(ctx, r.pts, { weight: 5 }).addTo(layer);
      else routeLayer(ctx, r.pts, { color: '#ff8a3d', weight: 2.5, outline: false }).addTo(layer);
      pinMarker(ctx, r.pts[0], `<span>${icon(SPORTS.run.icon, 18)}</span>`, `pin-marker ${r.id === selected ? 'sel' : ''}`)
        .on('click', () => { selected = r.id; drawRoutes(); scrollTo(r.id); })
        .addTo(layer);
    });
    const saved = store.get().savedRoutes;
    carousel.innerHTML = list.length ? list.map((r) => card(r, saved)).join('') : '<div class="route-card empty">Bu filtrelere uyan rota yok.</div>';
  };
  const scrollTo = (id) => carousel.querySelector(`[data-r="${id}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

  // ---------- Ayak İzi Atlası ----------
  const months = (() => {
    const acts = store.myActivities();
    if (!acts.length) return [];
    const first = new Date(acts[acts.length - 1].date), now = new Date();
    const out = [];
    for (let d = new Date(first.getFullYear(), first.getMonth(), 1); d <= now; d.setMonth(d.getMonth() + 1)) out.push(new Date(d));
    return out;
  })();
  const range = { a: 0, b: Math.max(0, months.length - 1) };
  const inRange = (act) => {
    if (!months.length) return false;
    const t = new Date(act.date);
    const start = months[range.a];
    const end = new Date(months[range.b]); end.setMonth(end.getMonth() + 1);
    return t >= start && t < end;
  };

  const drawAtlas = () => {
    layer.clearLayers(); hl.clearLayers();
    const acts = store.myActivities().filter(inRange);
    const ink = accentColor();
    if (acts.length < 5) acts.forEach((x) => routeLayer(ctx, store.activityPts(x), { weight: 3, outline: false }).addTo(layer));
    else acts.forEach((x) => L.polyline(ctx.lls(store.activityPts(x)), { renderer: ctx.renderer, color: ink, weight: 2.5, opacity: 0.22, interactive: false }).addTo(layer));
    const label = months.length ? `${AY_KISA[months[range.a].getMonth()]} ${months[range.a].getFullYear()} – ${AY_KISA[months[range.b].getMonth()]} ${months[range.b].getFullYear()}` : '';
    atlasPanel.innerHTML = months.length ? `
      <div class="atlas-head"><b>Ayak İzi Atlası</b><span>${label} · ${acts.length} aktivite</span></div>
      <div class="atlas-range">
        <input type="range" min="0" max="${months.length - 1}" value="${range.a}" data-ra aria-label="Başlangıç ayı"/>
        <input type="range" min="0" max="${months.length - 1}" value="${range.b}" data-rb aria-label="Bitiş ayı"/>
      </div>
      <div class="atlas-ticks">${months.map((m) => `<span>${AY_KISA[m.getMonth()]}</span>`).join('')}</div>
      <div class="atlas-hit muted">Bir sokağa dokun: oradan kaç kez geçtiğini gör.</div>`
      : `<div class="atlas-head"><b>Ayak İzi Atlası</b></div><p class="muted">Henüz çizgin yok. İlk aktiviteni kaydet, haritan burada oluşmaya başlasın.</p><a class="btn primary block" href="#/record">İlk çizgini çek</a>`;
    atlasPanel.querySelectorAll('input[type=range]').forEach((inp) => (inp.oninput = () => {
      const va = Number(atlasPanel.querySelector('[data-ra]').value), vb = Number(atlasPanel.querySelector('[data-rb]').value);
      range.a = Math.min(va, vb); range.b = Math.max(va, vb);
      drawAtlas();
    }));
  };

  ctx.map.on('click', (e) => {
    if (!f.atlas) return;
    const p = [e.latlng.lng, e.latlng.lat];
    const near = store.myActivities().filter(inRange).filter((x) => store.activityPts(x).some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 9));
    hl.clearLayers();
    L.circleMarker(e.latlng, { renderer: ctx.renderer, radius: 10, color: '#fff', weight: 2, fillOpacity: 0 }).addTo(hl);
    const box = atlasPanel.querySelector('.atlas-hit');
    if (!box) return;
    if (!near.length) { box.innerHTML = 'Buradan hiç geçmedin. Bir dahaki keşfin burası olabilir.'; return; }
    const first = near[near.length - 1];
    box.innerHTML = `<b>Bu sokaktan ${near.length} kez geçtin</b> · ilk: ${shortDate(first.date)}
      <div class="atlas-list">${near.slice(0, 4).map((x) => `<a href="#/activity/${x.id}">${esc(x.title)} · ${shortDate(x.date)}</a>`).join('')}</div>`;
  });

  // ---------- Genel ----------
  const draw = () => {
    root.querySelector('.map-screen').classList.toggle('atlas-on', f.atlas);
    root.querySelector('[data-c="atlas"]').classList.toggle('active', f.atlas);
    root.querySelector('[data-c="routes"]').classList.toggle('active', !f.atlas);
    root.querySelector('[data-c="len"]').textContent = LENGTHS[f.len].label;
    root.querySelector('[data-c="diff"]').textContent = DIFFS[f.diff];
    root.querySelector('[data-c="surf"]').textContent = SURFACES[f.surf];
    root.querySelector('[data-c="len"]').classList.toggle('active', !!f.len);
    root.querySelector('[data-c="diff"]').classList.toggle('active', !!f.diff);
    root.querySelector('[data-c="surf"]').classList.toggle('active', !!f.surf);
    root.querySelector('[data-c="elev"]').classList.toggle('active', f.sort);
    root.querySelector('[data-saved]').classList.toggle('active', f.saved);
    root.querySelectorAll('[data-mood]').forEach((b) => b.classList.toggle('active', b.dataset.mood === f.mood));
    f.atlas ? drawAtlas() : drawRoutes();
  };

  carousel.addEventListener('click', (e) => {
    const tb = e.target.closest('[data-trait]');
    if (tb) {
      const r = ROUTES.find((x) => x.id === tb.dataset.route);
      const c = routeCharacter(r)[tb.dataset.trait];
      selected = r.id; drawRoutes();
      const runs = maskRuns(r.pts, c.mask);
      runs.forEach((run) => L.polyline(ctx.lls(run), { renderer: ctx.renderer, color: '#ffffff', weight: 8, opacity: 0.85 }).addTo(hl));
      fitPts(ctx, r.pts, 60);
      toast(runs.length ? `${TRAITS.find((t) => t.key === tb.dataset.trait).label}: ${c.text}` : `${c.text} — bu rotada belirgin değil`);
      return;
    }
    const bm = e.target.closest('[data-bm]');
    if (bm) { const on = store.toggle('savedRoutes', bm.dataset.bm); toast(on ? 'Rota kaydedildi' : 'Rota kaldırıldı'); return drawRoutes(); }
    const cardEl = e.target.closest('[data-r]');
    if (!cardEl) return;
    if (selected === cardEl.dataset.r) return routeSheet(cardEl.dataset.r);
    selected = cardEl.dataset.r; drawRoutes();
    fitPts(ctx, ROUTES.find((r) => r.id === selected).pts, 60);
  });

  root.querySelector('.chips').addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (!c) return;
    if (c === 'atlas') { f.atlas = !f.atlas; history.replaceState(null, '', f.atlas ? '#/maps?atlas=1' : '#/maps'); return draw(); }
    f.atlas = false; history.replaceState(null, '', '#/maps');
    if (c === 'len') f.len = (f.len + 1) % LENGTHS.length;
    if (c === 'diff') f.diff = (f.diff + 1) % DIFFS.length;
    if (c === 'surf') f.surf = (f.surf + 1) % SURFACES.length;
    if (c === 'elev') { f.sort = !f.sort; f.mood = 'all'; toast(f.sort ? 'En çok tırmanış önce' : 'Varsayılan sıralama'); }
    if (c === 'routes') Object.assign(f, { len: 0, diff: 0, surf: 0, sort: false, saved: false, mood: 'all' });
    draw();
  });
  root.querySelector('.mood-row').addEventListener('click', (e) => {
    const m = e.target.closest('[data-mood]')?.dataset.mood;
    if (!m) return;
    f.mood = m; f.sort = false; f.atlas = false; history.replaceState(null, '', '#/maps');
    draw();
    carousel.scrollTo({ left: 0, behavior: 'smooth' });
  });
  input.oninput = () => { f.atlas = false; draw(); };
  root.querySelector('[data-saved]').onclick = () => { f.saved = !f.saved; f.atlas = false; draw(); };
  root.querySelector('[data-sport]').onclick = () => toast('Şimdilik yalnızca koşu rotaları');
  root.querySelector('[data-3d]').onclick = () => toast('3D görünüm yakında');
  root.querySelector('[data-locate]').onclick = () => ctx.map.flyToBounds([[200, 300], [500, 700]], { duration: 0.6 });
  root.querySelector('[data-layers]').onclick = () => {
    store.update((s) => (s.mapTheme = s.mapTheme === 'dark' ? 'light' : 'dark'));
    toast(store.get().mapTheme === 'dark' ? 'Koyu harita' : 'Açık harita');
    ctx.map.remove();
    renderMaps(root, new URLSearchParams(f.atlas ? 'atlas=1' : ''));
  };

  draw();
  if (f.atlas && months.length) ctx.map.fitBounds([[150, 0], [900, 1000]]);
  else ctx.map.setView([380, 480], 0.25);
  return () => ctx.map.remove();
}

function routeSheet(id) {
  const r = ROUTES.find((x) => x.id === id);
  const c = routeCharacter(r);
  sheet(`${closeBtn()}<h2>${esc(r.name)}</h2>
    <div class="sheet-map">${miniMapSVG(r.pts, { aspect: 1.6 })}</div>
    <div class="trait-list">${TRAITS.map((t) => `<div>${traitGlyph(t, c[t.key].lvl, 26)}<span><b>${t.label}</b><small>${c[t.key].text}</small></span></div>`).join('')}</div>
    <h3>Yükselti silueti</h3><div class="sil">${silhouetteSVG(r.pts)}</div>
    <div class="stats3"><div><span>Mesafe</span><b>${km(r.distance, 1)} km</b></div><div><span>Tırmanış</span><b>${r.gain} m</b></div><div><span>Zorluk</span><b>${r.difficulty}</b></div></div>
    <a class="btn primary block" href="#/record?route=${r.id}">Bu rotayı kullan</a>`, (el, close) => el.querySelector('a').addEventListener('click', close));
}
