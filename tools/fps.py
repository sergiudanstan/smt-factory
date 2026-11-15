#!/usr/bin/env python3
"""Measure frame rate of a page in headless Chrome on the real GPU (Metal), per camera view.
usage: python3 -I tools/fps.py dist/factory.html [--views plant,line1] [--wait 12000]"""
import sys, json, asyncio, argparse, pathlib
from playwright.async_api import async_playwright
FPS_JS = """() => new Promise(res => { let n = 0; const t0 = performance.now();
  function f(){ n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res({fps: +(n / ((performance.now() - t0) / 1000)).toFixed(1),
    calls: window.__sim && __sim.stats ? __sim.stats().calls : null}); } requestAnimationFrame(f); })"""
async def main(a):
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome', headless=True, args=['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu'])
        pg = await b.new_page(viewport={'width': 1600, 'height': 1000})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(pathlib.Path(a.page).resolve().as_uri()); await pg.wait_for_timeout(a.wait)
        r = await pg.evaluate("() => { const c = document.createElement('canvas').getContext('webgl'); const d = c && c.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; }")
        print('renderer:', r)
        if a.speed: await pg.evaluate(f"() => __sim.setSpeed({a.speed})")
        for v in (a.views or 'plant').split(','):
            await pg.evaluate(f"() => {{ __sim.setView && __sim.setView({json.dumps(v)}); __sim.snapCam && __sim.snapCam(); }}")
            await pg.wait_for_timeout(800)
            print(v, await pg.evaluate(FPS_JS))
        print('errors:', len(errs), errs[:3]); await b.close()
ap = argparse.ArgumentParser(); ap.add_argument('page'); ap.add_argument('--views'); ap.add_argument('--wait', type=int, default=12000); ap.add_argument('--speed', type=float, default=0)
asyncio.run(main(ap.parse_args()))
