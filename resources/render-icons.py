# render-icons.mjs'in hazırladığı SVG'leri Chromium ile PNG'ye çevirir.
import asyncio, json, os
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))

async def main():
    jobs = json.load(open(os.path.join(HERE, '.icon-jobs.json')))
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        for out, svg, w, h in jobs:
            w, h = round(w), round(h)
            await pg.set_viewport_size({'width': w, 'height': h})
            await pg.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            await pg.screenshot(path=out, omit_background=True, clip={'x': 0, 'y': 0, 'width': w, 'height': h})
        await b.close()
    os.remove(os.path.join(HERE, '.icon-jobs.json'))
    print(f'{len(jobs)} PNG üretildi')

asyncio.run(main())
