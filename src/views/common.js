import { store } from '../store.js';
import { miniMapSVG } from '../map/render.js';
import { icon, avatar, esc, km, pace, speed, duration, longDate, SPORTS } from '../util.js';
import { sheet, closeBtn, toast } from '../ui.js';
import { frameMarks } from '../features/motion.js';

export function primaryStat(a) {
  return a.type === 'ride'
    ? { label: 'Hız', value: `${speed(a.duration, a.distance)} km/s` }
    : { label: 'Tempo', value: `${pace(a.duration, a.distance)} /km` };
}

export function coordLabel([x, y]) {
  // Kurgusal şehrin harita birimlerinden temsili koordinat etiketi
  const lat = 38.38 + y / 25000, lon = 27.05 + x / 20000;
  const dms = (v, a, b) => `${Math.floor(v)}°${String(Math.round((v % 1) * 60)).padStart(2, '0')}′${v >= 0 ? a : b}`;
  return `${dms(lat, 'K', 'G')} · ${dms(lon, 'D', 'B')}`;
}

export function activityCard(a, i = 0) {
  const u = store.user(a.userId);
  const ps = primaryStat(a);
  return `
  <article class="card act-card rise" style="--d:${Math.min(i, 6) * 70}ms" data-act="${a.id}">
    <header class="act-head" data-open="${a.id}">
      ${avatar(u)}
      <div>
        <div class="act-user">${esc(u.name)}</div>
        <div class="act-meta">${icon(SPORTS[a.type].icon, 16)} ${longDate(a.date)}</div>
      </div>
    </header>
    <h3 class="act-title" data-open="${a.id}">${esc(a.title)}</h3>
    <div class="stats3">
      <div><span>Mesafe</span><b>${km(a.distance)} km</b></div>
      <div><span>${ps.label}</span><b>${ps.value}</b></div>
      <div><span>Süre</span><b>${duration(a.duration)}</b></div>
    </div>
    ${a.private ? `<p class="note">${icon('users', 18)} Bu aktivite yalnızca takipçilerine görünür.</p>` : ''}
    <div class="act-map framed" data-open="${a.id}">${miniMapSVG(store.activityPts(a))}${frameMarks(SPORTS[a.type].label.toLocaleUpperCase('tr'), coordLabel(store.activityPts(a)[0]))}</div>
    ${a.kudos || a.comments.length ? `<div class="act-social">${a.kudos ? `${a.kudos} beğeni` : ''}${a.kudos && a.comments.length ? ' · ' : ''}${a.comments.length ? `${a.comments.length} yorum` : ''}</div>` : ''}
    <footer class="act-actions">
      <button class="icon-btn ${a.liked ? 'liked' : ''}" data-like="${a.id}" aria-label="Beğen">${icon('like', 26)}</button>
      <button class="icon-btn" data-open="${a.id}" aria-label="Yorum">${icon('comment', 26)}</button>
      <button class="icon-btn" data-share="${a.id}" aria-label="Paylaş">${icon('share', 26)}</button>
    </footer>
  </article>`;
}

/** Aktivite kartı listelerinde beğen/aç/paylaş etkileşimleri */
export function bindActivityList(root, rerender) {
  root.addEventListener('click', (e) => {
    const like = e.target.closest('[data-like]');
    if (like) {
      store.update((s) => {
        const a = s.activities.find((x) => x.id === like.dataset.like);
        a.liked = !a.liked;
        a.kudos += a.liked ? 1 : -1;
      });
      return rerender();
    }
    const share = e.target.closest('[data-share]');
    if (share) return shareSheet();
    const open = e.target.closest('[data-open]');
    if (open) location.hash = `#/activity/${open.dataset.open}`;
  });
}

export function shareSheet() {
  sheet(`${closeBtn()}<h2>Paylaş</h2>
    <div class="share-row">
      ${['Bağlantıyı kopyala', 'Mesaj', 'Hikâye', 'Görsel olarak kaydet'].map((t) => `<button class="pill" data-t="${t}">${t}</button>`).join('')}
    </div>`, (el, close) => {
    el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { close(); toast(`${b.dataset.t}: taslak sürümde devre dışı`); }));
  });
}

export function premiumSheet() {
  const feats = ['Rotaları planla, kaydet ve çevrimdışı kullan', 'Arkadaşlarınla özel yarışmalar oluştur', 'Detaylı antrenman günlüğü', 'Yük ve toparlanma takibi', 'Gelişmiş nabız bölgesi analizi'];
  sheet(`${closeBtn()}
    <div class="premium">
      <div class="premium-badge">MOVECIRCLE+</div>
      <h1>Her adımından daha fazlasını çıkar</h1>
      <ul>${feats.map((f) => `<li>${icon('check', 22)}<span>${f}</span></li>`).join('')}</ul>
      <button class="btn primary block" data-buy>${store.get().premium ? 'MoveCircle+ aktif ✓' : '30 gün ücretsiz dene'}</button>
      <p class="fine">Bu bir demo: gerçek ödeme alınmaz, yalnızca yerel olarak açılır.</p>
    </div>`, (el, close) => {
    el.querySelector('[data-buy]').onclick = () => {
      store.update((s) => (s.premium = !s.premium));
      close();
      toast(store.get().premium ? 'MoveCircle+ deneme sürümü açıldı (demo)' : 'MoveCircle+ kapatıldı');
      window.dispatchEvent(new Event('hashchange'));
    };
  }, { full: true });
}
