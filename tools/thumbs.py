#!/usr/bin/env python3
"""Capture clean thumbnails of every page (all overlays hidden) for the landing page.
usage: python3 -I tools/thumbs.py [page ...]   ->  img/<page>.png  (800 x 500 PNG)
       python3 -I tools/thumbs.py printer:top  ->  img/printer-top.png (try another camera view)
Needs Google Chrome (Playwright channel 'chrome') and Pillow."""
import sys, asyncio, pathlib
from playwright.async_api import async_playwright
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'img'
# page, camera view, sim seconds to fast-forward first, real ms to wait after load
SHOTS = [
    ('factory', 'line1', 0, 22000),
    ('printer', 'over', 40, 3000),
    ('placement', 'board', 70, 3000),
    ('aoi', 'follow', 60, 3000),
    ('spi', 'inside', 40, 3000),
    ('reflow', 'hood', 0, 7000),
    ('handling', 'ld_over', 120, 3000),
    ('building', 'warehouse', 30, 6000),
    ('props', 'row3', 5, 3000),
]
HIDE = """() => { const s = document.getElementById('side'); if (s) s.style.display = 'none';
  document.querySelectorAll('[data-ov], .panel, #tags, #loading, #hint, .load-error').forEach(e => e.style.display = 'none');
  window.dispatchEvent(new Event('resize')); return 1; }"""

async def main(only):
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome', args=['--use-gl=angle', '--use-angle=swiftshader',
                                    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        jobs = []
        for a in (only or []):
            if ':' in a:
                pg_, vw = a.split(':'); base = next(x for x in SHOTS if x[0] == pg_); jobs.append((pg_, vw, base[2], base[3], f'{pg_}-{vw}'))
        if not jobs:
            jobs = [(pg_, vw, ff, wt, pg_) for pg_, vw, ff, wt in SHOTS if not only or pg_ in only]
        for page, view, ff, wait, name in jobs:
            pg = await b.new_page(viewport={'width': 1600, 'height': 1000})
            await pg.goto((ROOT / 'dist' / f'{page}.html').as_uri()); await pg.wait_for_timeout(wait)
            if ff: await pg.evaluate(f'() => __sim.ff({ff})')
            await pg.evaluate(f"() => {{ __sim.setView && __sim.setView('{view}'); }}")
            await pg.wait_for_timeout(400)
            await pg.evaluate('() => __sim.snapCam && __sim.snapCam()')
            await pg.evaluate(HIDE); await pg.wait_for_timeout(1800)
            raw = OUT / f'{name}_raw.png'; await pg.screenshot(path=str(raw)); await pg.close()
            im = Image.open(raw).convert('RGB').resize((800, 500), Image.LANCZOS)
            im.save(OUT / f'{name}.png', optimize=True); raw.unlink()
            print(name, (OUT / f'{name}.png').stat().st_size // 1024, 'KB')
        await b.close()

asyncio.run(main(sys.argv[1:]))
