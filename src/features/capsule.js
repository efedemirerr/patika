// Zaman Kapsülü: rotadaki bir noktaya kendine not bırak; oradan tekrar geçtiğinde açılır.
// Tamamen yerel: konum yakınlığı ve durum cihazda tutulur.
import L from 'leaflet';
import { store } from '../store.js';
import { routeById, walkPath } from '../map/city.js';
import { shortDate, esc, icon } from '../util.js';
import { sheet, closeBtn, toast } from '../ui.js';

export const NEAR = 14; // harita birimi (~170 m)

export function capsules() {
  const s = store.get();
  if (!Array.isArray(s.capsules)) {
    // İlk açılışta bir örnek kapsül: Moda Sahil Akşam Turu'nun ilk kilometresinde
    const d = new Date(); d.setDate(d.getDate() - 31);
    const r1 = routeById('r1');
    const [x, y] = walkPath(r1.pts, r1.distance * 0.12).point;
    s.capsules = [{ id: 'cap1', x: +x.toFixed(1), y: +y.toFixed(1), text: 'Geçen ay buradan geçerken 5K’yı ilk kez durmadan koştun. Bugün de yapabilirsin.', created: d.toISOString(), opened: null }];
    store.save();
  }
  return s.capsules;
}

export function capsuleMarker(ctx, c) {
  const html = c.opened ? `<span class="cap open">${icon('check', 14)}</span>` : `<span class="cap sealed"><i></i></span>`;
  return L.marker(ctx.ll([c.x, c.y]), { icon: L.divIcon({ className: 'cap-marker', html, iconSize: [30, 30], iconAnchor: [15, 15] }) });
}

/** Rota üzerindeki bir noktaya kapsül bırakma penceresi */
export function dropCapsuleSheet([x, y], onDone) {
  sheet(`${closeBtn()}<h2>Zaman Kapsülü</h2>
    <p class="muted small">Bu noktaya kendine bir not bırak. Buradan tekrar geçtiğinde açılacak.</p>
    <div class="env-preview">${envelopeSVG(false)}</div>
    <form class="form"><textarea class="input" name="t" rows="3" maxlength="200" placeholder="Gelecekteki kendine…" required></textarea>
    <button class="btn primary block">Mühürle</button></form>`, (el, close) => {
    el.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const text = new FormData(e.target).get('t').trim();
      if (!text) return;
      store.update(() => capsules().push({ id: 'cap' + Date.now(), x, y, text, created: new Date().toISOString(), opened: null }));
      close(); toast('Kapsül mühürlendi'); onDone?.();
    };
  });
}

/** Açılış anı: zarf açılır, not belirir */
export function openCapsuleSheet(c) {
  store.update(() => { c.opened = new Date().toISOString(); });
  sheet(`${closeBtn()}<div class="cap-open">
      <div class="env-anim">${envelopeSVG(true)}</div>
      <small class="muted">${shortDate(c.created)} tarihinde bıraktın</small>
      <blockquote>${esc(c.text)}</blockquote>
      <button class="btn primary block" data-close>Devam et</button>
    </div>`);
}

/** Kayıt sırasında yakındaki mühürlü kapsülü bulur */
export function nearbySealed([x, y]) {
  return capsules().find((c) => !c.opened && Math.hypot(c.x - x, c.y - y) < NEAR);
}

export function envelopeSVG(opening) {
  return `<svg viewBox="0 0 160 110" class="envelope ${opening ? 'opening' : ''}" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="30" width="140" height="74" rx="6" fill="#efe7d6"/>
    <rect x="22" y="22" width="116" height="60" rx="3" fill="#fbf8f1" class="letter"/>
    <path d="M30 40h70M30 50h96M30 60h84" stroke="#1e2430" stroke-opacity=".35" stroke-width="3" stroke-linecap="round" class="letter"/>
    <path d="M10 104 L80 62 L150 104Z" fill="#e3d8c2"/>
    <path d="M10 30 L80 76 L150 30Z" fill="#d9ccb1" class="flap"/>
    <g class="wax"><circle cx="80" cy="72" r="12" fill="#d2492a"/><path d="M73 72a7 7 0 1 0 7-7" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/><circle cx="85" cy="67" r="2" fill="#fff"/></g>
  </svg>`;
}
