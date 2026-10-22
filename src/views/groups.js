import { store, CLUBS, CHALLENGES, EVENTS, RACES, challengeProgress } from '../store.js';
import { icon, esc, AY_KISA, GUN_KISA, SPORTS, shortDate } from '../util.js';
import { LOCALE } from '../i18n.js';
import { raceArt, clubBadge, challengeMedal } from '../features/art.js';
import { toast } from '../ui.js';

const TABS = [['challenges', 'Meydan Okumalar'], ['clubs', 'Kulüpler'], ['events', 'Etkinlikler']];

export function renderGroups(root, params) {
  let tab = params.get('tab') || 'events';
  const draw = () => {
    const s = store.get();
    root.innerHTML = `
      <div class="topbar"><h1 class="page-title">Gruplar</h1>
        <div class="top-actions">
          <button class="icon-btn" data-soon="Mesajlar">${icon('chat', 28)}</button>
          <button class="icon-btn" data-soon="Grup arama">${icon('search', 28)}</button>
          <button class="icon-btn" data-soon="Grup ayarları">${icon('gear', 28)}</button>
        </div></div>
      <nav class="tabs">${TABS.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</nav>
      <div class="tab-body">${tab === 'challenges' ? challenges(s) : tab === 'clubs' ? clubs(s) : events(s)}</div>`;
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button,[data-ev]');
    if (!b) return;
    if (b.dataset.tab) { tab = b.dataset.tab; history.replaceState(null, '', `#/groups?tab=${tab}`); }
    if (b.dataset.soon) toast(`${b.dataset.soon} yakında`);
    if (b.dataset.club) toast(store.toggle('joinedClubs', b.dataset.club) ? 'Kulübe katıldın' : 'Kulüpten ayrıldın');
    if (b.dataset.ch) toast(store.toggle('joinedChallenges', b.dataset.ch) ? 'Meydan okumaya katıldın' : 'Meydan okumadan ayrıldın');
    if (b.dataset.ev) toast(store.toggle('joinedEvents', b.dataset.ev) ? 'Etkinliğe katılıyorsun' : 'Katılım iptal edildi');
    draw();
  });
  draw();
}

function challenges(s) {
  return `<div class="stack">${CHALLENGES.map((c) => {
    const joined = s.joinedChallenges.includes(c.id);
    const p = challengeProgress(c);
    return `<div class="card ch-card">
      <div class="ch-medal">${challengeMedal(c, p, joined)}</div>
      <div class="ch-body"><b>${esc(c.title)}</b><small>${esc(c.desc)}</small>
        ${joined ? `<div class="bar"><i style="width:${(p * 100).toFixed(0)}%;background:${c.color}"></i></div><small>%${(p * 100).toFixed(0)} tamamlandı</small>` : ''}
      </div>
      <button class="btn ${joined ? 'ghost' : 'primary'} sm" data-ch="${c.id}">${joined ? 'Katıldın' : 'Katıl'}</button>
    </div>`;
  }).join('')}</div>`;
}

function clubs(s) {
  return `<div class="stack">${CLUBS.map((c) => {
    const joined = s.joinedClubs.includes(c.id);
    return `<div class="card club">
      <div class="club-logo">${clubBadge(c)}</div>
      <div class="ch-body"><b>${esc(c.name)}</b><small>${SPORTS[c.sport].label} · ${esc(c.place)} · ${c.members + (joined ? 1 : 0)} üye</small></div>
      <button class="btn ${joined ? 'ghost' : 'primary'} sm" data-club="${c.id}">${joined ? 'Üyesin' : 'Katıl'}</button>
    </div>`;
  }).join('')}</div>`;
}

function events(s) {
  return `
    <div class="sec-head"><h2>Yerel Kulüp Etkinlikleri</h2><span>Tümü ${icon('chevRight', 16)}</span></div>
    <div class="hscroll">${EVENTS.map((e) => {
      const d = new Date(e.date);
      const on = s.joinedEvents.includes(e.id);
      return `<div class="card ev-card ${on ? 'on' : ''}" data-ev="${e.id}">
        <div class="cal"><span>${AY_KISA[d.getMonth()]}</span><b>${d.getDate()}</b><small>${GUN_KISA[d.getDay()]}</small></div>
        <div class="ev-body"><b>${esc(e.title)}</b><small>${icon(SPORTS[e.sport].icon, 15)} ${SPORTS[e.sport].label} · ${esc(e.place)}</small><small>${esc(e.club)} · ${e.members} üye ${on ? '· ✓ Katılıyorsun' : ''}</small></div>
      </div>`;
    }).join('')}</div>
    <div class="sec-head"><h2>Yarışlar</h2><span>Tümü ${icon('chevRight', 16)}</span></div>
    <div class="stack">${RACES.map((r) => `
      <div class="card race">
        <div class="race-art framed" style="--h:${r.hue}">${raceArt(r)}<span class="race-dist">${r.dist}</span><span class="date-tag">${shortDate(r.date)}</span></div>
        <div class="race-body"><b>${esc(r.title)}</b>
          <small>${icon('pin', 16)} ${esc(r.place)}</small>
          <small>${icon('shoe', 16)} ${r.dist}</small>
          <small>${icon('users', 16)} ${r.runners.toLocaleString(LOCALE)} MoveCircle sporcusu katılıyor</small>
        </div>
      </div>`).join('')}</div>`;
}
