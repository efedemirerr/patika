// CI'da derlenmiş siteyi açıp harita ekranlarının ekran görüntüsünü alır (PMTiles altlığı doğrulaması).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const U = process.env.SMOKE_URL || 'http://localhost:4173/';
const out = 'smoke-out'; mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const errs = [];
for (const lang of ['tr', 'en']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(`localStorage.setItem('movecircle-lang','${lang}')`);
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => errs.push(String(e)));
  for (const [n, h] of [['maps', '#/maps'], ['detail', '#/activity/a2'], ['record', '#/record?route=r7'], ['home', '#/home']]) {
    await pg.goto(U + h); await pg.waitForTimeout(6000);
    await pg.screenshot({ path: `${out}/${lang}-${n}.png` });
  }
  await ctx.close();
}
await b.close();
console.log('ERRORS', JSON.stringify(errs));
