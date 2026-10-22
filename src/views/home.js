import { store, streakWeeks, NOTIFS, weeklyTotals, weekStart } from '../store.js';
import { liveTopo, countUp, observeDraw, greeting, frameMarks } from '../features/motion.js';
import { accentColor } from '../map/render.js';
import { icon, avatar, esc, LOGO } from '../util.js';
import { activityCard, bindActivityList, premiumSheet } from './common.js';
import { sheet, closeBtn, toast } from '../ui.js';
import { manualActivitySheet } from './manual.js';

export function renderHome(root) {
  let stopTopo = null;
  const draw = () => {
    const s = store.get();
    const streak = streakWeeks();
    const feed = s.activities.slice(0, 20);
    const week = weeklyTotals(null, 1)[0];
    const ws = weekStart();
    const mine = store.myActivities();
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const perDay = dayNames.map((l, i) => {
      const d0 = new Date(ws); d0.setDate(ws.getDate() + i);
      const d1 = new Date(d0); d1.setDate(d0.getDate() + 1);
      const m = mine.filter((a) => { const t = new Date(a.date); return t >= d0 && t < d1; }).reduce((x, a) => x + a.distance, 0);
      return { l, m, today: new Date() >= d0 && new Date() < d1 };
    });
    const maxDay = Math.max(1, ...perDay.map((d) => d.m));
    const days = perDay.map((d) => ({ ...d, h: (0.12 + 0.88 * (d.m / maxDay)).toFixed(2) }));
    root.innerHTML = `
    <div class="topbar">
      <button class="upgrade" data-up>${LOGO}<span>${s.premium ? 'MoveCircle+' : 'Yükselt'}</span></button>
      <div class="top-actions">
        <button class="icon-btn" data-add aria-label="Ekle">${icon('plus', 28)}</button>
        <button class="icon-btn" data-chat aria-label="Mesajlar">${icon('chat', 28)}</button>
        <button class="icon-btn" data-search aria-label="Ara">${icon('search', 28)}</button>
        <button class="icon-btn bell" data-bell aria-label="Bildirimler">${icon('bell', 28)}<i>${NOTIFS.length}</i></button>
      </div>
    </div>

    <section class="hero framed">
      <canvas class="hero-topo"></canvas>
      ${frameMarks('SAHA KAYDI', new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }).toLocaleUpperCase('tr'))}
      <div class="hero-in">
        <p class="hero-hi">${greeting()}, ${esc(s.me.name.split(' ')[0])}</p>
        <h1 class="hero-title">Bu hafta <em data-count="${week.distance}" data-fmt="km">0</em> km</h1>
        <div class="week-strip">${days.map((d) => `<div class="day ${d.today ? 'today' : ''} ${d.m ? 'on' : ''}"><i style="--h:${d.h}"></i><span>${d.l}</span></div>`).join('')}</div>
        <div class="hero-foot">
          <div class="streak-pill">${icon('flame', 18)} <b data-count="${streak}">0</b> haftalık seri</div>
          <a class="btn primary sm breathe" href="#/record">${icon('play', 14)} Kaydet</a>
        </div>
      </div>
    </section>

    <div class="feed">${feed.map(activityCard).join('')}</div>
    <p class="feed-end">Akışın sonuna geldin 🎉</p>`;

    stopTopo?.();
    stopTopo = liveTopo(root.querySelector('.hero-topo'), { color: accentColor(), alpha: 0.2 });
    countUp(root.querySelector('.hero'));
    observeDraw(root);
    root.querySelector('[data-up]').onclick = premiumSheet;
    root.querySelector('[data-add]').onclick = () => manualActivitySheet(draw);
    root.querySelector('[data-chat]').onclick = () => toast('Mesajlar yakında');
    root.querySelector('[data-search]').onclick = searchSheet;
    root.querySelector('[data-bell]').onclick = notifSheet;
  };
  draw();
  bindActivityList(root, draw);
  return () => stopTopo?.();
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
