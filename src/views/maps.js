import L from 'leaflet';
import { store } from '../store.js';
import { ROUTES } from '../map/city.js';
import { createCityMap, routeLayer, pinMarker, fitPts, miniMapSVG } from '../map/render.js';
import { icon, km, esc, SPORTS } from '../util.js';
import { toast, sheet, closeBtn } from '../ui.js';

const LENGTHS = [
  { label: 'Uzunluk', test: () => true },
  { label: '< 5 km', test: (r) => r.distance < 5000 },
  { label: '5–10 km', test: (r) => r.distance >= 5000 && r.distance <= 10000 },
  { label: '> 10 km', test: (r) => r.distance > 10000 },
];
const DIFFS = ['Zorluk', 'Kolay', 'Orta', 'Zor'];
const SURFACES = ['Zemin', 'Asfalt', 'Toprak', 'Karışık'];

export function renderMaps(root) {
  const f = { len: 0, diff: 0, surf: 0, sort: false, saved: false, sport: 'run' };
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
          <button class="chip active" data-c="routes">Rotalar</button>
          <button class="chip" data-c="len">Uzunluk</button>
          <button class="chip" data-c="diff">Zorluk</button>
          <button class="chip" data-c="elev">İrtifa</button>
          <button class="chip" data-c="surf">Zemin</button>
        </div>
      </div>
      <div class="fab-col">
        <button class="fab" data-layers>${icon('layers')}<i>2</i></button>
        <button class="fab" data-3d><b>3D</b></button>
        <button class="fab" data-locate>${icon('locate')}</button>
      </div>
      <div class="route-carousel"></div>
    </div>`;

  const ctx = createCityMap(root.querySelector('#map'), { theme: store.get().mapTheme });
  const layer = L.layerGroup().addTo(ctx.map);
  const input = root.querySelector('input');
  const carousel = root.querySelector('.route-carousel');
  let selected = null;

  const filtered = () => {
    let list = ROUTES.filter((r) =>
      LENGTHS[f.len].test(r) && (!f.diff || r.difficulty === DIFFS[f.diff]) && (!f.surf || r.surface === SURFACES[f.surf]) &&
      (!f.saved || store.get().savedRoutes.includes(r.id)) && r.name.toLocaleLowerCase('tr').includes(input.value.toLocaleLowerCase('tr').trim()));
    if (f.sort) list = [...list].sort((a, b) => b.gain - a.gain);
    return list;
  };

  const draw = () => {
    const list = filtered();
    if (!list.find((r) => r.id === selected)) selected = list[0]?.id || null;
    layer.clearLayers();
    list.forEach((r) => {
      if (r.id === selected) routeLayer(ctx, r.pts, { weight: 5 }).addTo(layer);
      else routeLayer(ctx, r.pts, { color: '#ff8a3d', weight: 2.5, outline: false }).addTo(layer);
      pinMarker(ctx, r.pts[0], `<span>${icon(SPORTS.run.icon, 18)}</span>`, `pin-marker ${r.id === selected ? 'sel' : ''}`)
        .on('click', () => { selected = r.id; draw(); scrollTo(r.id); })
        .addTo(layer);
    });
    const saved = store.get().savedRoutes;
    carousel.innerHTML = list.length
      ? list.map((r) => `
        <div class="route-card ${r.id === selected ? 'sel' : ''}" data-r="${r.id}">
          <div class="rc-map">${miniMapSVG(r.pts, { aspect: 1 })}</div>
          <div class="rc-body">
            <b>${esc(r.name)}</b>
            <span>${icon(SPORTS.run.icon, 16)} ${km(r.distance, 1)} km · ${r.gain} m</span>
            <span>${icon('mountain', 16)} ${r.difficulty} · ${r.surface}</span>
            <em>${icon('pin', 15)} Liman Şehri</em>
          </div>
          <button class="bm ${saved.includes(r.id) ? 'on' : ''}" data-bm="${r.id}">${icon('bookmark', 20)}</button>
        </div>`).join('')
      : '<div class="route-card empty">Bu filtrelere uyan rota yok.</div>';
    root.querySelector('[data-c="len"]').textContent = LENGTHS[f.len].label;
    root.querySelector('[data-c="diff"]').textContent = DIFFS[f.diff];
    root.querySelector('[data-c="surf"]').textContent = SURFACES[f.surf];
    root.querySelector('[data-c="len"]').classList.toggle('active', !!f.len);
    root.querySelector('[data-c="diff"]').classList.toggle('active', !!f.diff);
    root.querySelector('[data-c="surf"]').classList.toggle('active', !!f.surf);
    root.querySelector('[data-c="elev"]').classList.toggle('active', f.sort);
    root.querySelector('[data-saved]').classList.toggle('active', f.saved);
  };
  const scrollTo = (id) => carousel.querySelector(`[data-r="${id}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

  carousel.addEventListener('click', (e) => {
    const bm = e.target.closest('[data-bm]');
    if (bm) { const on = store.toggle('savedRoutes', bm.dataset.bm); toast(on ? 'Rota kaydedildi' : 'Rota kaldırıldı'); return draw(); }
    const card = e.target.closest('[data-r]');
    if (!card) return;
    if (selected === card.dataset.r) return routeSheet(card.dataset.r);
    selected = card.dataset.r; draw();
    fitPts(ctx, ROUTES.find((r) => r.id === selected).pts, 60);
  });

  root.querySelector('.chips').addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (c === 'len') f.len = (f.len + 1) % LENGTHS.length;
    if (c === 'diff') f.diff = (f.diff + 1) % DIFFS.length;
    if (c === 'surf') f.surf = (f.surf + 1) % SURFACES.length;
    if (c === 'elev') f.sort = !f.sort, toast(f.sort ? 'En çok tırmanış önce' : 'Varsayılan sıralama');
    if (c === 'routes') Object.assign(f, { len: 0, diff: 0, surf: 0, sort: false, saved: false });
    draw();
  });
  input.oninput = draw;
  root.querySelector('[data-saved]').onclick = () => { f.saved = !f.saved; draw(); };
  root.querySelector('[data-sport]').onclick = () => toast('Şimdilik yalnızca koşu rotaları');
  root.querySelector('[data-3d]').onclick = () => toast('3D görünüm yakında');
  root.querySelector('[data-locate]').onclick = () => ctx.map.flyToBounds([[200, 300], [500, 700]], { duration: 0.6 });
  root.querySelector('[data-layers]').onclick = () => {
    store.update((s) => (s.mapTheme = s.mapTheme === 'dark' ? 'light' : 'dark'));
    toast(store.get().mapTheme === 'dark' ? 'Koyu harita' : 'Açık harita');
    renderMaps(root);
  };

  draw();
  ctx.map.setView([380, 480], 0.25);
  return () => ctx.map.remove();
}

function routeSheet(id) {
  const r = ROUTES.find((x) => x.id === id);
  sheet(`${closeBtn()}<h2>${esc(r.name)}</h2>
    <div class="sheet-map">${miniMapSVG(r.pts, { aspect: 1.6 })}</div>
    <div class="stats3"><div><span>Mesafe</span><b>${km(r.distance, 1)} km</b></div><div><span>Tırmanış</span><b>${r.gain} m</b></div><div><span>Zorluk</span><b>${r.difficulty}</b></div></div>
    <a class="btn primary block" href="#/record?route=${r.id}">Bu rotayı kullan</a>`, (el, close) => el.querySelector('a').addEventListener('click', close));
}
