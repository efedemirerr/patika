import { store, streakWeeks, NOTIFS } from '../store.js';
import { icon, avatar, esc, LOGO } from '../util.js';
import { activityCard, bindActivityList, premiumSheet } from './common.js';
import { sheet, closeBtn, toast } from '../ui.js';
import { manualActivitySheet } from './manual.js';

export function renderHome(root) {
  const draw = () => {
    const s = store.get();
    const streak = streakWeeks();
    const feed = s.activities.slice(0, 20);
    root.innerHTML = `
    <div class="topbar">
      <button class="upgrade" data-up>${LOGO}<span>${s.premium ? 'Patika+' : 'Yükselt'}</span></button>
      <div class="top-actions">
        <button class="icon-btn" data-add aria-label="Ekle">${icon('plus', 28)}</button>
        <button class="icon-btn" data-chat aria-label="Mesajlar">${icon('chat', 28)}</button>
        <button class="icon-btn" data-search aria-label="Ara">${icon('search', 28)}</button>
        <button class="icon-btn bell" data-bell aria-label="Bildirimler">${icon('bell', 28)}<i>${NOTIFS.length}</i></button>
      </div>
    </div>

    <section class="streak card">
      <div class="streak-head"><b>Serin</b><a href="#/you/progress">Takvimi gör</a></div>
      <div class="streak-body">
        <div class="streak-num">${icon('flame', 54, 'class="flame"')}<span>${streak}</span><small>Hafta</small></div>
        <p>${streak ? `${streak} haftadır her hafta hareket ediyorsun. Böyle devam!` : 'Bir aktivite kaydederek serini başlat.'}</p>
        <a class="btn primary sm" href="#/record">Kaydet</a>
      </div>
    </section>

    <div class="feed">${feed.map(activityCard).join('')}</div>
    <p class="feed-end">Akışın sonuna geldin 🎉</p>`;

    root.querySelector('[data-up]').onclick = premiumSheet;
    root.querySelector('[data-add]').onclick = () => manualActivitySheet(draw);
    root.querySelector('[data-chat]').onclick = () => toast('Mesajlar yakında');
    root.querySelector('[data-search]').onclick = searchSheet;
    root.querySelector('[data-bell]').onclick = notifSheet;
  };
  draw();
  bindActivityList(root, draw);
}

function notifSheet() {
  sheet(`${closeBtn()}<h2>Bildirimler</h2>
    <ul class="list">${NOTIFS.map((n) => {
      const u = store.user(n.who);
      return `<li>${avatar(u, 40)}<div><b>${esc(u.name)}</b> ${esc(n.text)}<small>${n.when}</small></div></li>`;
    }).join('')}</ul>`);
}

function searchSheet() {
  sheet(`${closeBtn()}<h2>Ara</h2>
    <input class="input" placeholder="Sporcu, kulüp veya aktivite ara" autofocus />
    <ul class="list results"></ul>`, (el) => {
    const input = el.querySelector('input');
    const out = el.querySelector('.results');
    input.oninput = () => {
      const q = input.value.toLocaleLowerCase('tr').trim();
      if (!q) return (out.innerHTML = '');
      const acts = store.get().activities.filter((a) => a.title.toLocaleLowerCase('tr').includes(q) || store.user(a.userId).name.toLocaleLowerCase('tr').includes(q)).slice(0, 8);
      out.innerHTML = acts.map((a) => `<li><a href="#/activity/${a.id}">${avatar(store.user(a.userId), 36)}<div><b>${esc(a.title)}</b><small>${esc(store.user(a.userId).name)}</small></div></a></li>`).join('') || '<li class="muted">Sonuç yok</li>';
      out.querySelectorAll('a').forEach((x) => (x.onclick = () => el.parentElement.remove()));
    };
  }, { full: true });
}
