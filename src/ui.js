import { icon } from './util.js';
import { tr } from './i18n.js';

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = tr(msg);
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}

/** Alttan açılan sayfa. html içeriği, onMount(el, close) ile bağlanır. */
export function sheet(html, onMount, { full = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet ${full ? 'sheet-full' : ''}"><div class="sheet-grip"></div>${html}</div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 250); };
  wrap.querySelector('.sheet-backdrop').onclick = close;
  wrap.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close));
  onMount?.(wrap.querySelector('.sheet'), close);
  return close;
}

export function closeBtn() {
  return `<button class="icon-btn round sheet-x" data-close aria-label="Kapat">${icon('close')}</button>`;
}
