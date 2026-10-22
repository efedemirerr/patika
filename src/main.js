import './styles.css';
import { icon, avatar } from './util.js';
import { store } from './store.js';
import { renderHome } from './views/home.js';
import { renderMaps } from './views/maps.js';
import { renderRecord } from './views/record.js';
import { renderGroups } from './views/groups.js';
import { renderYou } from './views/you.js';
import { renderActivity } from './views/activity.js';
import { startPalette } from './features/palette.js';

startPalette();

const ROUTES = {
  home: { render: renderHome, nav: 'home' },
  maps: { render: renderMaps, nav: 'maps', full: true },
  record: { render: renderRecord, nav: 'record', full: true, hideNav: true },
  groups: { render: renderGroups, nav: 'groups' },
  you: { render: renderYou, nav: 'you' },
  activity: { render: renderActivity, nav: null, full: true },
};

const app = document.getElementById('app');
app.innerHTML = `<main id="view"></main><nav class="bottom-nav"></nav>`;
const nav = app.querySelector('.bottom-nav');
let cleanup = null;

function drawNav(active) {
  const items = [['home', 'Ana Sayfa', 'home'], ['maps', 'Haritalar', 'map'], ['record', 'Kayıt', 'record'], ['groups', 'Gruplar', 'groups'], ['you', 'Sen', null]];
  nav.innerHTML = items.map(([k, l, ic]) => `<a href="#/${k}" class="${k === active ? 'on' : ''}"><span class="nav-ic">${ic ? icon(ic, 28) : avatar(store.get().me, 30)}</span>${l}</a>`).join('');
}

function route() {
  const hash = location.hash.replace(/^#\/?/, '') || 'home';
  const [pathPart, query = ''] = hash.split('?');
  const [name, sub] = pathPart.split('/');
  const r = ROUTES[name] || ROUTES.home;
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  const old = document.getElementById('view');
  const view = document.createElement('main');
  view.id = 'view';
  view.className = r.full ? 'full' : '';
  old.replaceWith(view);
  document.querySelectorAll('.sheet-wrap').forEach((s) => s.remove());
  nav.style.display = r.hideNav ? 'none' : '';
  drawNav(r.nav);
  cleanup = r.render(view, new URLSearchParams(query), sub) || null;
  if (!r.full) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
