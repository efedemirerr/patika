import { store, weeklyTotals, CHALLENGES } from '../store.js';
import { icon, avatar, esc, km, duration, AY_KISA } from '../util.js';
import { activityCard, bindActivityList } from './common.js';
import { sheet, closeBtn, toast } from '../ui.js';
import { applyPalette, paletteBand } from '../features/palette.js';

const FILTERS = [[null, 'Egzersiz', 'pulse'], ['run', 'Koşu', 'shoe'], ['ride', 'Bisiklet', 'bike'], ['walk', 'Yürüyüş', 'walk']];

export function renderYou(root, params, sub) {
  let tab = sub || 'progress';
  let sport = null;
  let q = '';

  const draw = () => {
    const s = store.get();
    const mine = store.myActivities();
    root.innerHTML = `
      <div class="topbar end"><div class="top-actions">
        <button class="icon-btn" data-add>${icon('plus', 28)}</button>
        <button class="icon-btn" data-soon="Sporcu arama">${icon('search', 28)}</button>
        <button class="icon-btn" data-settings>${icon('gear', 28)}</button>
      </div></div>
      <section class="profile">
        ${avatar(s.me, 96)}
        <div><h1>${esc(s.me.name)}</h1><p>${mine.length} aktivite</p></div>
      </section>
      <p class="follow">${s.me.followers} takipçi • ${s.me.following} takip edilen</p>
      <div class="two-btn"><button class="btn outline" data-edit>Profili düzenle</button><button class="btn outline" data-share>Profili paylaş</button></div>
      <nav class="tabs icons">
        <button class="${tab === 'progress' ? 'on' : ''}" data-tab="progress">${icon('chart', 30)}<span>İlerleme</span></button>
        <button class="${tab === 'acts' ? 'on' : ''}" data-tab="acts">${icon('pulse', 30)}<span>Aktiviteler</span></button>
        <button class="${tab === 'more' ? 'on' : ''}" data-tab="more">${icon('menu', 30)}<span>Daha Fazla</span></button>
      </nav>
      <div class="tab-body">${tab === 'progress' ? progress() : tab === 'acts' ? acts(mine) : more(mine, s)}</div>`;
    if (tab === 'acts') {
      const inp = root.querySelector('.search-in');
      inp.value = q;
      inp.oninput = () => { q = inp.value; const pos = inp.selectionStart; draw(); const n = root.querySelector('.search-in'); n.focus(); n.setSelectionRange(pos, pos); };
    }
  };

  const progress = () => {
    const w = weeklyTotals(sport);
    const cur = w[w.length - 1];
    return `<div class="card progress">
      <div class="chips scroll">${FILTERS.map(([k, l, ic]) => `<button class="chip ${k === sport ? 'active' : ''}" data-sport="${k ?? ''}">${icon(ic, 18)} ${l}</button>`).join('')}</div>
      <h3>Bu hafta</h3>
      <div class="stats3 two"><div><span>Süre</span><b>${duration(cur.duration)}</b></div><div><span>Mesafe</span><b>${km(cur.distance, 1)} km</b></div></div>
      <small class="muted">Son 12 hafta</small>
      ${chart(w)}
      <button class="btn outline block" data-tab="more">İlerlemeni detaylı gör</button>
    </div>`;
  };

  const acts = (mine) => {
    const l = mine.filter((a) => a.title.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')));
    return `<div class="search-wrap">${icon('search', 22)}<input class="search-in" placeholder="Anahtar kelimeyle ara"/></div>
      <div class="feed">${l.map(activityCard).join('') || '<p class="muted center">Aktivite bulunamadı</p>'}</div>`;
  };

  const more = (mine, s) => {
    const year = new Date().getFullYear();
    const yearDist = mine.filter((a) => new Date(a.date).getFullYear() === year).reduce((t, a) => t + a.distance, 0);
    const totalTime = mine.reduce((t, a) => t + a.duration, 0);
    const longest = mine.reduce((m, a) => Math.max(m, a.distance), 0);
    return `<ul class="menu">
        <li data-stats>${icon('stats', 30)}<div><b>İstatistikler</b><small>Bu yıl: ${km(yearDist, 1)} km</small></div>${icon('chevRight')}</li>
        <li data-go="#/maps">${icon('route', 30)}<div><b>Rotalar</b><small>${s.savedRoutes.length} kayıtlı</small></div>${icon('chevRight')}</li>
        <li data-soon="Segmentler">${icon('pin', 30)}<div><b>Segmentler</b><small>—</small></div>${icon('chevRight')}</li>
        <li data-soon="Ekipman">${icon('bike', 30)}<div><b>Ekipman</b><small>—</small></div>${icon('chevRight')}</li>
      </ul>
      <div class="sec-head"><h2>Meydan Okumalar</h2></div>
      <div class="card info">${s.joinedChallenges.length
        ? `${s.joinedChallenges.length} meydan okumaya katıldın: ${s.joinedChallenges.map((id) => esc(CHALLENGES.find((c) => c.id === id)?.title || '')).join(', ')}`
        : 'Motive kalmak ve rozet toplamak için bir meydan okumaya katıl.'}
        <a class="btn primary block" href="#/groups?tab=challenges">Meydan okumalara göz at</a></div>
      <div class="card info muted">Toplam süre: ${duration(totalTime)} · En uzun: ${km(longest, 1)} km</div>`;
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab],[data-sport],[data-soon],[data-go],[data-stats],[data-edit],[data-share],[data-settings],[data-add]');
    if (!t) return;
    if (t.dataset.tab) { tab = t.dataset.tab; history.replaceState(null, '', `#/you/${tab}`); draw(); }
    else if (t.dataset.sport !== undefined) { sport = t.dataset.sport || null; draw(); }
    else if (t.dataset.soon) toast(`${t.dataset.soon} yakında`);
    else if (t.dataset.go) location.hash = t.dataset.go;
    else if (t.dataset.stats !== undefined) statsSheet();
    else if (t.dataset.edit !== undefined) editSheet(draw);
    else if (t.dataset.share !== undefined) { navigator.clipboard?.writeText(location.href.split('#')[0] + '#/you').catch(() => {}); toast('Profil bağlantısı kopyalandı'); }
    else if (t.dataset.settings !== undefined) settingsSheet();
    else if (t.dataset.add !== undefined) import('./manual.js').then((m) => m.manualActivitySheet(draw));
  });
  bindActivityList(root, draw);
  draw();
}

function chart(weeks) {
  const W = 320, H = 170, padR = 52, padB = 26, innerW = W - padR - 8, innerH = H - padB - 14;
  const max = Math.max(3600, ...weeks.map((w) => w.duration));
  const top = Math.ceil(max / 1800) * 1800;
  const x = (i) => 8 + (innerW * i) / (weeks.length - 1);
  const y = (v) => 10 + innerH - (innerH * v) / top;
  const line = weeks.map((w, i) => `${x(i).toFixed(1)},${y(w.duration).toFixed(1)}`).join(' ');
  const area = `M${x(0)},${y(0)} L${line.replace(/ /g, ' L')} L${x(weeks.length - 1)},${y(0)}Z`;
  const fmt = (s) => `${Math.floor(s / 3600)}sa ${pad2((s % 3600) / 60)}dk`;
  let lastMonth = -1;
  const months = weeks.map((w, i) => { const m = w.start.getMonth(); if (m !== lastMonth && i) { lastMonth = m; return `<text x="${x(i)}" y="${H - 6}" class="ax">${AY_KISA[m]}</text>`; } lastMonth = m; return ''; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></linearGradient></defs>
    ${[0, 0.5, 1].map((k) => `<line x1="8" x2="${8 + innerW}" y1="${y(top * k)}" y2="${y(top * k)}" class="grid"/><text x="${W - padR + 8}" y="${y(top * k) + 4}" class="ax">${fmt(top * k)}</text>`).join('')}
    <path d="${area}" fill="url(#cg)"/>
    <polyline points="${line}" fill="none" style="stroke:var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
    ${weeks.map((w, i) => `<circle cx="${x(i)}" cy="${y(w.duration)}" r="${i === weeks.length - 1 ? 6 : 4}" style="fill:${i === weeks.length - 1 ? 'var(--accent)' : '#141519'};stroke:var(--accent)" stroke-width="2"/>`).join('')}
    <line x1="${x(weeks.length - 1)}" x2="${x(weeks.length - 1)}" y1="6" y2="${y(0)}" stroke="#fff" stroke-width="1.5"/>
    ${months}
  </svg>`;
}
const pad2 = (n) => String(Math.floor(n)).padStart(2, '0');

function statsSheet() {
  const mine = store.myActivities();
  const rows = ['run', 'ride', 'walk'].map((t) => {
    const l = mine.filter((a) => a.type === t);
    return `<tr><td>${{ run: 'Koşu', ride: 'Bisiklet', walk: 'Yürüyüş' }[t]}</td><td>${l.length}</td><td>${km(l.reduce((s, a) => s + a.distance, 0), 1)} km</td><td>${duration(l.reduce((s, a) => s + a.duration, 0))}</td></tr>`;
  }).join('');
  sheet(`${closeBtn()}<h2>İstatistikler</h2><table class="table"><thead><tr><th>Spor</th><th>Adet</th><th>Mesafe</th><th>Süre</th></tr></thead><tbody>${rows}</tbody></table>`);
}

function editSheet(done) {
  const me = store.get().me;
  sheet(`${closeBtn()}<h2>Profili düzenle</h2><form class="form">
    <label>Ad Soyad<input class="input" name="name" value="${esc(me.name)}"/></label>
    <label>Şehir<input class="input" name="city" value="${esc(me.city)}"/></label>
    <label>Profil rengi<input type="color" name="color" value="${me.color}"/></label>
    <button class="btn primary block">Kaydet</button></form>`, (el, close) => {
    el.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      store.update((s) => Object.assign(s.me, { name: f.get('name') || s.me.name, city: f.get('city'), color: f.get('color') }));
      close(); done();
    };
  });
}

function settingsSheet() {
  sheet(`${closeBtn()}<h2>Ayarlar</h2>
    <ul class="menu">
      <li data-theme>${icon('layers', 26)}<div><b>Harita teması</b><small>${store.get().mapTheme === 'dark' ? 'Koyu' : 'Açık'}</small></div></li>
      <li data-palette>${icon('flame', 26)}<div><b>Hava Paleti</b><small>${store.get().palette !== false ? 'Açık · renkler güneşe göre değişir' : 'Kapalı · sabit renkler'}</small>${paletteBand()}</div></li>
      <li data-reset>${icon('trash', 26)}<div><b>Demo verilerini sıfırla</b><small>Tüm yerel kayıtlar silinir</small></div></li>
      <li>${icon('stats', 26)}<div><b>Hakkında</b><small>MoveCircle taslak sürüm 0.2 · tamamen çevrimdışı, sunucusuz</small></div></li>
    </ul>`, (el, close) => {
    el.querySelector('[data-palette]').onclick = () => { store.update((st) => (st.palette = st.palette === false)); applyPalette(); close(); toast(store.get().palette !== false ? 'Hava Paleti açık' : 'Hava Paleti kapalı'); };
    el.querySelector('[data-theme]').onclick = () => { store.update((s) => (s.mapTheme = s.mapTheme === 'dark' ? 'light' : 'dark')); close(); toast('Harita teması değişti'); };
    el.querySelector('[data-reset]').onclick = () => { if (confirm('Tüm demo verileri sıfırlansın mı?')) { store.reset(); close(); location.hash = '#/home'; location.reload(); } };
  });
}
