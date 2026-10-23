// CI: güncel uygulamanın İngilizce tanıtım ekran görüntüleri (Figma sunumu için) → smoke-out/press-en/
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const U = process.env.SMOKE_URL || 'http://localhost:4173/';
const OUT = 'smoke-out/press-en'; mkdirSync(OUT, { recursive: true });
const RM = "document.querySelectorAll('.sheet-wrap').forEach(e=>e.remove())";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, geolocation: { latitude: 40.9806, longitude: 29.0267 }, permissions: ['geolocation'] });
await ctx.addInitScript("localStorage.setItem('movecircle-lang','en')");
const pg = await ctx.newPage();
const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
const W = (ms) => pg.waitForTimeout(ms);
const S = async (n, ms = 0) => { if (ms) await W(ms); await pg.screenshot({ path: `${OUT}/${n}.jpg`, type: 'jpeg', quality: 86 }); };
const step = async (n, fn) => { try { await fn(); } catch (e) { errs.push(n + ': ' + e.message.split('\n')[0]); } };

// Ücretsiz kullanıcı: yükseltme ekranı
await step('premium', async () => { await pg.goto(U + '#/home'); await W(2500); await pg.click('[data-up]'); await S('18-premium', 1000); await pg.evaluate(RM); });
// MoveCircle+ deneme başlat (tüm avantajlar açık)
await step('upgrade', async () => { await pg.click('[data-up]'); await W(700); await pg.click('[data-buy="trial"]'); await W(1200); await pg.evaluate(RM); });
await step('home', async () => { await pg.goto(U + '#/home'); await S('01-home', 5000); });
await step('maps', async () => { await pg.goto(U + '#/maps'); await W(2500); await pg.click('[data-mood="calm"]'); await S('02-maps-character', 4000); });
await step('atlas', async () => { await pg.goto(U + '#/maps?atlas=1'); await S('03-atlas', 5000); });
await step('detail', async () => { await pg.goto(U + '#/activity/a2'); await S('04-detail', 5000); });
await step('rhythm', async () => { await pg.locator('.rhythm').scrollIntoViewIfNeeded(); await pg.evaluate('window.scrollBy(0,-120)'); await pg.click('[data-play]'); await S('05-rhythm', 1500); await pg.click('[data-play]'); });
await step('seal', async () => { await pg.goto(U + '#/activity/a2'); await W(2500); await pg.click('[data-seal]'); await S('06-seal', 2800); await pg.click('[data-pc]'); await S('07-postcard', 1000); await pg.evaluate(RM); });
await step('film', async () => { await pg.goto(U + '#/activity/a5'); await W(2500); await pg.click('[data-film]'); await S('08-film', 8000); });
await step('record', async () => { await pg.goto(U + '#/home'); await W(800); await pg.goto(U + '#/record'); await S('09-record-ghost', 5000); });
await step('capsule', async () => {
  await pg.click('[data-fast]'); await pg.click('[data-fast]'); await pg.click('[data-start]');
  for (let i = 0; i < 80; i++) { await W(500); if (await pg.locator('.cap-open').count()) break; }
  await S('10-capsule', 1800); await pg.evaluate(RM); await pg.click('[data-resume]'); await W(5000); await pg.click('[data-pause]'); await S('11-record-running', 1500);
});
await step('gps', async () => { await pg.goto(U + '#/home'); await W(800); await pg.goto(U + '#/record'); await W(3000); await pg.click('[data-mode="gps"]'); await S('20-record-gps', 3500); });
await step('races', async () => { await pg.goto(U + '#/groups'); await W(1500); await pg.evaluate('window.scrollTo(0, 330)'); await S('12-races', 1800); });
await step('challenges', async () => { await pg.goto(U + '#/groups?tab=challenges'); await S('13-challenges', 1600); });
await step('rings', async () => { await pg.goto(U + '#/you/progress'); await S('15-rings', 2000); await pg.locator('.sig-card').scrollIntoViewIfNeeded(); await pg.evaluate('window.scrollBy(0,-40)'); await S('16-signature', 1500); });
await step('acts', async () => { await pg.goto(U + '#/you/acts'); await S('19-activities', 4000); });
await step('settings', async () => { await pg.goto(U + '#/you'); await W(800); await pg.click('[data-settings]'); await S('17-settings', 800); await pg.evaluate(RM); });
await step('stats', async () => { await pg.goto(U + '#/you/more'); await W(900); await pg.click('[data-stats]'); await S('21-stats-plus', 800); });
await b.close();
console.log('PRESS ERRORS', JSON.stringify(errs));
