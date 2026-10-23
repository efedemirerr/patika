// CI: uygulamanın ~2,5 dakikalık telefon ekranı tanıtım videosu (İngilizce) → smoke-out/video/
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync } from 'node:fs';
const U = process.env.SMOKE_URL || 'http://localhost:4173/';
const OUT = 'smoke-out/video'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  recordVideo: { dir: OUT, size: { width: 780, height: 1688 } },
  geolocation: { latitude: 40.9806, longitude: 29.0267 }, permissions: ['geolocation'],
});
await ctx.addInitScript(() => {
  localStorage.setItem('movecircle-lang', 'en');
  // Dokunma göstergesi: videoda nereye basıldığı görünsün
  addEventListener('DOMContentLoaded', () => {
    const st = document.createElement('style');
    st.textContent = '.tap-dot{position:fixed;z-index:2147483647;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.9);pointer-events:none;animation:tapd .55s ease-out forwards}@keyframes tapd{from{transform:scale(.4);opacity:1}to{transform:scale(1.25);opacity:0}}';
    document.head.appendChild(st);
  });
});
const pg = await ctx.newPage();
const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
const W = (ms) => pg.waitForTimeout(ms);
async function tap(sel, { wait = 900, nth = 0 } = {}) {
  const el = pg.locator(sel).nth(nth);
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (!box) throw new Error('no box ' + sel);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await pg.mouse.move(x, y, { steps: 8 });
  await pg.evaluate(([x, y]) => { const d = document.createElement('div'); d.className = 'tap-dot'; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 700); }, [x, y]);
  await W(180);
  await pg.mouse.click(x, y);
  await W(wait);
}
async function scroll(dy, steps = 6, root = null) {
  for (let i = 0; i < steps; i++) { await pg.mouse.wheel(0, dy / steps); await W(90); }
  await W(600);
}
const step = async (n, fn) => { try { await fn(); } catch (e) { errs.push(n + ': ' + e.message.split('\n')[0]); } };

await pg.goto(U + '#/home'); await W(4500);                       // Home: canlı hafta kartı
await pg.mouse.move(195, 500);
await step('feed', async () => { await scroll(700, 8); await W(1500); await scroll(-700, 6); });
await step('maps', async () => { await tap('.bottom-nav a[href="#/maps"]', { wait: 3500 }); await tap('[data-mood="calm"]', { wait: 2500 }); await tap('[data-mood="energy"]', { wait: 2500 }); });
await step('route', async () => { await tap('.route-card[data-r]', { wait: 1500 }); await tap('.route-card[data-r].sel', { wait: 2500 }); await pg.mouse.move(195, 600); await scroll(500, 6); await W(1500); await pg.evaluate("document.querySelectorAll('.sheet-wrap').forEach(e=>e.remove())"); await W(600); });
await step('atlas', async () => { await tap('[data-c="atlas"]', { wait: 2200 }); });
await step('upgrade', async () => { await W(1500); await tap('[data-buy="trial"]', { wait: 2500 }); await pg.evaluate("document.querySelectorAll('.sheet-wrap').forEach(e=>e.remove())"); await tap('[data-c="atlas"]', { wait: 3500 }); });
await step('record', async () => {
  await tap('.bottom-nav a[href="#/record"]', { wait: 3000 });
  await tap('[data-fast]', { wait: 500 }); await tap('[data-fast]', { wait: 700 });
  await tap('[data-start]', { wait: 500 });
  for (let i = 0; i < 80; i++) { await W(500); if (await pg.locator('.cap-open').count()) break; }
  await W(3500);
  await tap('.sheet .btn.primary', { wait: 800 }).catch(() => pg.evaluate("document.querySelectorAll('.sheet-wrap').forEach(e=>e.remove())"));
  await tap('[data-resume]', { wait: 7000 });
  await tap('[data-pause]', { wait: 1200 });
  await tap('[data-finish]', { wait: 1800 });
  await tap('.sheet form .btn.primary', { wait: 1000 });
});
await step('film', async () => { await W(22000); await W(1500); });
await step('postcard', async () => {
  const pc = pg.locator('.film-end [data-card]');
  if (await pc.count()) await tap('.film-end [data-card]', { wait: 1800 });
  else { await pg.keyboard.press('Escape'); }
  await tap('[data-tpl="pafta"]', { wait: 1500 }); await tap('[data-tpl="poster"]', { wait: 1800 });
  await pg.evaluate("document.querySelectorAll('.sheet-wrap,.film').forEach(e=>e.remove())"); await W(800);
});
await step('detail', async () => { await pg.goto(U + '#/activity/a2'); await W(3000); await pg.mouse.move(195, 600); await scroll(900, 8); await tap('[data-play]', { wait: 4500 }); await tap('[data-play]', { wait: 600 }); });
await step('groups', async () => { await tap('.bottom-nav a[href="#/groups"]', { wait: 2500 }); await pg.mouse.move(195, 500); await scroll(500, 6); await W(2500); });
await step('you', async () => { await tap('.bottom-nav a[href="#/you"]', { wait: 3500 }); await pg.mouse.move(195, 600); await scroll(900, 8); await W(2500); await scroll(-900, 5); });
await step('stats', async () => { await tap('[data-tab="more"]', { wait: 1200 }); await tap('[data-stats]', { wait: 3000 }); await pg.evaluate("document.querySelectorAll('.sheet-wrap').forEach(e=>e.remove())"); });
await step('home', async () => { await tap('.bottom-nav a[href="#/home"]', { wait: 3500 }); });
const v = pg.video();
await ctx.close(); await b.close();
const p = await v.path();
renameSync(p, `${OUT}/walkthrough.webm`);
console.log('WALK ERRORS', JSON.stringify(errs), readdirSync(OUT));
