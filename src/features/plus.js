// MoveCircle+ : fiyatlar, avantajlar ve kilitli özellikler.
// Tamamen demo: ödeme alınmaz, abonelik yalnızca localStorage'da tutulur.
import { store } from '../store.js';
import { icon, LOGO, longDate } from '../util.js';
import { isEn } from '../i18n.js';
import { sheet, closeBtn, toast } from '../ui.js';

const L = (tr, en) => (isEn ? en : tr);
const DEC = isEn ? '.' : ',';
export const money = (n) => '₺' + n.toFixed(2).replace('.', DEC);

export const TRIAL_DAYS = 30;
export const PLANS = {
  year: { price: 899.99, per: () => L('yıl', 'yr'), name: () => L('Yıllık', 'Yearly') },
  month: { price: 149.99, per: () => L('ay', 'mo'), name: () => L('Aylık', 'Monthly') },
};
const SAVING = Math.round((1 - PLANS.year.price / (PLANS.month.price * 12)) * 100);

// Her avantaj uygulamada gerçekten açılır; "go" o özelliğin olduğu ekrana götürür.
export const PERKS = [
  { id: 'ghost', ic: 'record', go: '#/record',
    t: () => L('Gölge Koşucu', 'Ghost Runner'),
    d: () => L('Aynı rotadaki en iyi koşunla canlı yarış; haritada hayalet nokta, anlık fark.', 'Race your best run on the same route live: a ghost dot on the map and the gap in real time.'),
    w: () => L('Kayıt', 'Record') },
  { id: 'atlas', ic: 'layers', go: '#/maps?atlas=1',
    t: () => L('Ayak İzi Atlası', 'Footprint Atlas'),
    d: () => L('Tüm aktivitelerinin üst üste çizildiği kişisel harita ve ay aralığı kaydırıcısı.', 'Every activity layered into one personal map, with a month range slider.'),
    w: () => L('Haritalar', 'Maps') },
  { id: 'postcard', ic: 'share', go: '#/activity/a2',
    t: () => L('Pafta ve Afiş kartpostalları', 'Survey and Poster postcards'),
    d: () => L('Gazete şablonuna ek olarak iki özel kartpostal tasarımı.', 'Two extra postcard designs on top of the Gazette template.'),
    w: () => L('Aktivite', 'Activity') },
  { id: 'stats', ic: 'stats', go: '#/you/more?stats=1',
    t: () => L('Gelişmiş istatistikler', 'Advanced stats'),
    d: () => L('Ortalama tempo, en hızlı koşu, haftalık ortalama ve 5K / 10K süre tahmini.', 'Average pace, fastest run, weekly average and a 5K / 10K time estimate.'),
    w: () => L('Sen → Daha Fazla', 'You → More') },
  { id: 'badge', ic: 'trophy', go: '#/you',
    t: () => L('MoveCircle+ rozeti', 'MoveCircle+ badge'),
    d: () => L('Profilinde parlayan halka ve Plus rozeti.', 'A glowing ring and Plus badge on your profile.'),
    w: () => L('Profil', 'Profile') },
];

export const isPlus = () => !!store.get().premium;

/** Kilitli bir öğenin yanına konan küçük "+" etiketi. */
export const plusTag = (txt = 'MoveCircle+') => `<span class="plus-tag">${icon('lock', 12)}${txt}</span>`;

const daysLeft = (p) => Math.max(0, Math.ceil((new Date(p.start).getTime() + TRIAL_DAYS * 864e5 - Date.now()) / 864e5));
const renewDate = (p) => {
  const d = new Date(p.start);
  if (p.trial) d.setDate(d.getDate() + TRIAL_DAYS);
  else if (p.plan === 'year') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
};

const perkList = (focus, active) => `<ul class="plus-perks">${PERKS.map((p) => `
  <li class="${p.id === focus ? 'focus' : ''}" ${active ? `data-perk="${p.id}"` : ''}>
    <span class="pk-ic">${icon(p.ic, 22)}</span>
    <div><b>${p.t()}</b><small>${p.d()}</small><em>${p.w()}</em></div>
    ${active ? `<span class="pk-on">${icon('check', 14)}${L('Açık', 'On')}</span>` : ''}
  </li>`).join('')}</ul>`;

const refresh = () => window.dispatchEvent(new Event('hashchange'));

/** Yükseltme ekranı. focus: kilitli özelliğe dokunulduysa o avantaj vurgulanır. */
export function premiumSheet(focus) {
  const s = store.get();
  if (s.premium) return manageSheet(focus);
  let plan = 'year';
  const fp = PERKS.find((p) => p.id === focus);
  sheet(`${closeBtn()}
    <div class="premium" data-no-i18n>
      <div class="premium-badge">MOVECIRCLE+</div>
      <h1>${fp ? L(`${fp.t()} MoveCircle+ ile açılır`, `${fp.t()} comes with MoveCircle+`) : L('Her adımından daha fazlasını çıkar', 'Get more out of every step')}</h1>
      <div class="plans">
        <button class="plan on" data-plan="year">
          <span class="plan-flag">${L(`%${SAVING} tasarruf`, `Save ${SAVING}%`)}</span>
          <b>${PLANS.year.name()}</b>
          <strong>${money(PLANS.year.price)}<small>/${PLANS.year.per()}</small></strong>
          <span>${L(`Aylık ${money(PLANS.year.price / 12)}'e denk`, `Just ${money(PLANS.year.price / 12)} a month`)}</span>
        </button>
        <button class="plan" data-plan="month">
          <b>${PLANS.month.name()}</b>
          <strong>${money(PLANS.month.price)}<small>/${PLANS.month.per()}</small></strong>
          <span>${L('İstediğin zaman iptal et', 'Cancel anytime')}</span>
        </button>
      </div>
      <h3 class="plus-h">${L('Yükseltince açılanlar', 'What you unlock')}</h3>
      ${perkList(focus, false)}
      <button class="btn primary block" data-buy="trial">${L(`${TRIAL_DAYS} gün ücretsiz başla`, `Start ${TRIAL_DAYS}-day free trial`)}</button>
      <p class="plus-after" data-after></p>
      <button class="btn outline block" data-buy="now"></button>
      <p class="fine">${L('Bu bir demo: gerçek ödeme alınmaz, abonelik yalnızca bu cihazda açılır.', 'This is a demo: no real payment is taken; the subscription only unlocks on this device.')}</p>
    </div>`, (el, close) => {
    const sync = () => {
      const p = PLANS[plan];
      el.querySelectorAll('[data-plan]').forEach((b) => b.classList.toggle('on', b.dataset.plan === plan));
      el.querySelector('[data-after]').textContent = L(
        `Deneme bitince ${money(p.price)}/${p.per()}. Bitişten önce iptal edersen ücret alınmaz.`,
        `Then ${money(p.price)}/${p.per()} after the trial. Cancel before it ends and you pay nothing.`);
      el.querySelector('[data-buy="now"]').textContent = L(`Denemesiz yükselt · ${money(p.price)}`, `Upgrade now · ${money(p.price)}`);
    };
    el.querySelectorAll('[data-plan]').forEach((b) => (b.onclick = () => { plan = b.dataset.plan; sync(); }));
    el.querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => {
      const trial = b.dataset.buy === 'trial';
      store.update((st) => { st.premium = true; st.plus = { plan, trial, start: new Date().toISOString() }; });
      close();
      toast(trial ? L('MoveCircle+ denemen başladı · tüm avantajlar açık', 'Your MoveCircle+ trial has started · all perks unlocked')
        : L('MoveCircle+ aktif · tüm avantajlar açık', 'MoveCircle+ is active · all perks unlocked'));
      refresh();
      setTimeout(() => manageSheet(focus, true), 320);
    }));
    sync();
  }, { full: true });
}

/** Abone olan kullanıcı için: plan durumu + açılan avantajlar (dokununca o ekrana gider). */
function manageSheet(focus, welcome = false) {
  const s = store.get();
  const p = s.plus || { plan: 'year', trial: true, start: new Date().toISOString() };
  const pl = PLANS[p.plan] || PLANS.year;
  sheet(`${closeBtn()}
    <div class="premium" data-no-i18n>
      <div class="premium-badge">MOVECIRCLE+</div>
      <h1>${welcome ? L('Hoş geldin! Avantajların açıldı', 'Welcome! Your perks are unlocked') : L('MoveCircle+ aktif', 'MoveCircle+ is active')}</h1>
      <div class="plus-status">
        <span class="ps-logo">${LOGO}</span>
        <div><b>${pl.name()} · ${money(pl.price)}/${pl.per()}</b>
          <small>${p.trial ? L(`Ücretsiz deneme · ${daysLeft(p)} gün kaldı`, `Free trial · ${daysLeft(p)} days left`) : L('Aktif abonelik', 'Active subscription')}</small>
          <small>${p.trial ? L('İlk ödeme', 'First charge') : L('Yenileme', 'Renews')}: ${longDate(renewDate(p)).split(' ').slice(0, 3).join(' ')}</small></div>
      </div>
      <h3 class="plus-h">${L('Açık avantajların · dokun ve dene', 'Your perks · tap to try')}</h3>
      ${perkList(focus, true)}
      <button class="btn outline block" data-switch>${p.plan === 'year' ? L(`Aylık plana geç · ${money(PLANS.month.price)}/ay`, `Switch to monthly · ${money(PLANS.month.price)}/mo`) : L(`Yıllık plana geç · ${money(PLANS.year.price)}/yıl`, `Switch to yearly · ${money(PLANS.year.price)}/yr`)}</button>
      <button class="btn ghost block" data-cancel>${L('Aboneliği iptal et', 'Cancel subscription')}</button>
      <p class="fine">${L('Demo abonelik: ödeme alınmaz.', 'Demo subscription: no payment is taken.')}</p>
    </div>`, (el, close) => {
    el.querySelectorAll('[data-perk]').forEach((li) => (li.onclick = () => {
      close(); location.hash = PERKS.find((x) => x.id === li.dataset.perk).go;
    }));
    el.querySelector('[data-switch]').onclick = () => {
      store.update((st) => { st.plus = { ...p, plan: p.plan === 'year' ? 'month' : 'year' }; });
      close(); toast(L('Plan değiştirildi', 'Plan changed')); refresh();
    };
    el.querySelector('[data-cancel]').onclick = () => {
      if (!confirm(L('MoveCircle+ iptal edilsin mi? Avantajlar hemen kapanır.', 'Cancel MoveCircle+? Your perks will turn off right away.'))) return;
      store.update((st) => { st.premium = false; st.plus = null; });
      close(); toast(L('MoveCircle+ iptal edildi', 'MoveCircle+ cancelled')); refresh();
    };
  }, { full: true });
}
