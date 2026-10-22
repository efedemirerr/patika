import { store } from '../store.js';
import { ROUTES, routeById } from '../map/city.js';
import { SPORTS, km, timeTitle, esc } from '../util.js';
import { sheet, closeBtn, toast } from '../ui.js';

export function manualActivitySheet(onDone) {
  sheet(`${closeBtn()}<h2>Manuel aktivite ekle</h2>
    <form class="form">
      <label>Tür<select name="type">${Object.entries(SPORTS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label>
      <label>Rota<select name="route">${ROUTES.map((r) => `<option value="${r.id}">${esc(r.name)} · ${km(r.distance, 1)} km</option>`).join('')}</select></label>
      <label>Süre (dakika)<input name="min" type="number" min="1" value="30" class="input"/></label>
      <label>Başlık<input name="title" class="input" placeholder="${timeTitle('run')}"/></label>
      <button class="btn primary block">Kaydet</button>
    </form>`, (el, close) => {
    el.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const r = routeById(f.get('route'));
      const a = store.addActivity({
        userId: 'me', type: f.get('type'), routeId: r.id, date: new Date().toISOString(),
        title: f.get('title') || timeTitle(f.get('type')), distance: r.distance, duration: Number(f.get('min')) * 60,
        gain: r.gain, kudos: 0, liked: false, comments: [], private: false,
      });
      close();
      toast('Aktivite eklendi');
      onDone ? onDone(a) : (location.hash = `#/activity/${a.id}`);
    };
  });
}
