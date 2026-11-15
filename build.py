#!/usr/bin/env python3
"""Build single-file pages.
Every src/pages/<name>.html is a working dev page (relative <script src> / <link> tags, opens via file://).
build.py inlines those tags and writes dist/<name>.html — one self-contained file per page.
usage: python3 build.py            (all pages)
       python3 build.py printer aoi (selected pages)
       python3 build.py --out /abs/dir printer   (write somewhere else, e.g. a reviewer's private folder)
"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent
PAGES = ROOT / 'src' / 'pages'
DIST = ROOT / 'dist'

def inline(page: pathlib.Path) -> str:
    html = page.read_text(encoding='utf-8')
    def script(m):
        p = (page.parent / m.group(1)).resolve()
        if not p.exists():
            print(f'  warning: {page.name}: missing {m.group(1)} (skipped)')
            return '<script>/* missing ' + m.group(1) + ' */</script>'
        code = p.read_text(encoding='utf-8')
        code = re.sub(r'</(script)', r'<\\/\1', code, flags=re.I)
        return '<script>/* ' + str(p.relative_to(ROOT)) + ' */\n' + code + '\n</script>'
    def style(m):
        p = (page.parent / m.group(1)).resolve()
        return '<style>/* ' + str(p.relative_to(ROOT)) + ' */\n' + p.read_text(encoding='utf-8') + '\n</style>'
    html = re.sub(r'<script src="([^"]+)"></script>', script, html)
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', style, html)
    return html

def main(names):
    global DIST
    if '--out' in names:
        i = names.index('--out'); DIST = pathlib.Path(names[i+1]).resolve(); names = names[:i] + names[i+2:]
    DIST.mkdir(parents=True, exist_ok=True)
    pages = sorted(PAGES.glob('*.html'))
    if names:
        pages = [p for p in pages if p.stem in names]
    for p in pages:
        out = DIST / p.name
        out.write_text(inline(p), encoding='utf-8')
        print(f'{out}  {out.stat().st_size/1024:.0f} KB')

if __name__ == '__main__':
    main(sys.argv[1:])
