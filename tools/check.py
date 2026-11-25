#!/usr/bin/env python3
"""Headless check of a page in Google Chrome (WebGL via SwiftShader).
Reports page errors + console errors/warnings, optionally fast-forwards the simulation,
prints a JSON summary of window.__sim (machines, line), and takes PNG screenshots.

usage:
  python3 -I tools/check.py dist/printer.html
  python3 -I tools/check.py dist/printer.html --ff 120 --shot /abs/out.png
  python3 -I tools/check.py dist/factory.html --ff 600 --views over,line1,printer --outdir /abs/dir
  python3 -I tools/check.py dist/aoi.html --eval "__sim.setXray(true)" --shot /abs/xray.png
options:
  --size WxH      viewport (default 1600x1000)
  --wait MS       real-time wait after load (default 2500)
  --ff S          fast-forward S sim-seconds after load (__sim.ff)
  --eval JS       run JS in the page before screenshots (repeatable)
  --views a,b,c   for each view: __sim.setView(name), wait, screenshot <outdir>/<page>_<view>.png
  --shot FILE     one screenshot of the current view
  --after MS      wait after each view change (default 1700)
  --light         switch the page to the light theme first
  --timeout MS    page load timeout (default 30000; factory.html needs more on software GL)
Exit code 1 if there were page errors.
"""
import sys, json, asyncio, argparse, pathlib
from playwright.async_api import async_playwright

SUMMARY_JS = r"""
() => {
  const s = window.__sim; if (!s) return {noSim: true};
  const out = {time: +(s.time||0).toFixed(2)};
  if (s.machines) out.machines = s.machines.map(m => ({id: m.id, kind: m.kind, state: m.state, step: m.step,
      in: m.counters.in, out: m.counters.out, ng: m.counters.ng, boards: m.boards.length,
      ct: +(m.ct||0).toFixed(2), avgCt: +(m.avgCt? m.avgCt():0).toFixed(2), util: m.util? +(m.util()*100).toFixed(1):null}));
  if (s.line) out.line = {out: s.line.out, wip: s.line.wip(), rate_bph: +s.line.rate().toFixed(1)};
  if (s.summary) try { out.page = s.summary(); } catch (e) { out.pageErr = String(e); }
  if (s.stats) try { out.render = s.stats(); } catch (e) {}
  const r = document.querySelector('canvas#c'); if (r) out.canvas = [r.width, r.height];
  return out;
}
"""

async def main(a):
    page_path = pathlib.Path(a.page).resolve()
    url = page_path.as_uri()
    w, h = map(int, a.size.split('x'))
    errs, warns = [], []
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome', args=['--use-gl=angle', '--use-angle=swiftshader',
                                    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': w, 'height': h})
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        def con(m):
            t = m.text
            if 'GL Driver Message' in t or 'GPU stall' in t: return
            if m.type == 'error': errs.append('console.error: ' + t)
            elif m.type == 'warning': warns.append('console.warn: ' + t)
        pg.on('console', con)
        if a.light:
            await pg.add_init_script("try{localStorage.setItem('smt-theme','light')}catch(e){}")
        await pg.goto(url, timeout=a.timeout)
        await pg.wait_for_timeout(a.wait)
        if a.ff:
            await pg.evaluate(f'() => window.__sim && window.__sim.ff({a.ff})')
            await pg.wait_for_timeout(600)
        for js in (a.eval or []):
            try:
                r = await pg.evaluate(f'() => {{ return ({js}); }}')
                if r is not None: print('eval:', json.dumps(r)[:2000])
            except Exception as e:
                errs.append('EVAL ' + js[:80] + ' -> ' + str(e)[:300])
            await pg.wait_for_timeout(400)
        if a.views:
            outdir = pathlib.Path(a.outdir or '.').resolve(); outdir.mkdir(parents=True, exist_ok=True)
            for v in a.views.split(','):
                await pg.evaluate(f'() => window.__sim && window.__sim.setView && window.__sim.setView({json.dumps(v)})')
                await pg.wait_for_timeout(300)
                await pg.evaluate('() => window.__sim && window.__sim.snapCam && window.__sim.snapCam()')   # finish the camera flight instantly
                await pg.wait_for_timeout(a.after)
                f = outdir / f'{page_path.stem}_{v}.png'
                await pg.screenshot(path=str(f)); print('saved', f)
        if a.shot:
            f = pathlib.Path(a.shot).resolve(); f.parent.mkdir(parents=True, exist_ok=True)
            await pg.screenshot(path=str(f)); print('saved', f)
        summ = await pg.evaluate(SUMMARY_JS)
        print('summary:', json.dumps(summ, indent=1)[:6000])
        await b.close()
    for e in errs[:30]: print(e)
    for x in warns[:10]: print(x)
    print(f'errors: {len(errs)}  warnings: {len(warns)}')
    return 1 if any(e.startswith('PAGEERROR') or e.startswith('console.error') for e in errs) else 0

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('page'); ap.add_argument('--size', default='1600x1000'); ap.add_argument('--wait', type=int, default=2500)
    ap.add_argument('--ff', type=float, default=0); ap.add_argument('--eval', action='append'); ap.add_argument('--views')
    ap.add_argument('--outdir'); ap.add_argument('--shot'); ap.add_argument('--after', type=int, default=1700)
    ap.add_argument('--light', action='store_true'); ap.add_argument('--timeout', type=int, default=30000)
    sys.exit(asyncio.run(main(ap.parse_args())))
