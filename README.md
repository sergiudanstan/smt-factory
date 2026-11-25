# SMT Factory Suite

[![CI](https://github.com/sergiudanstan/smt-factory/actions/workflows/ci.yml/badge.svg)](https://github.com/sergiudanstan/smt-factory/actions/workflows/ci.yml)
[![CodeQL](https://github.com/sergiudanstan/smt-factory/actions/workflows/codeql.yml/badge.svg)](https://github.com/sergiudanstan/smt-factory/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/sergiudanstan/smt-factory/badge)](https://scorecard.dev/viewer/?uri=github.com/sergiudanstan/smt-factory)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Interactive 3D simulations of an SMT (surface-mount) assembly line, machine by machine, and an electronics plant built from the same machine models. Every machine runs its own process and boards pass from machine to machine through a SMEMA-style handoff. Generic machine models with dimensions and process data typical of each machine class; no brands.

**Live:** https://sergiudanstan.github.io/smt-factory/

## Pages

Each page is one self-contained HTML file in `dist/` (no network access, opens from `file://`), built with three.js r147.

| Page | What it shows |
|---|---|
| `factory.html` | A 72 × 42 m plant with two dual-lane lines (24 machines), warehouse, utilities, offices, plant KPIs, a state timeline per machine, andon boards, AMRs and operators |
| `printer.html` | Solder paste printer: stencil printing with vision alignment, paste dispenser, under-stencil cleaning |
| `spi.html` | 3D solder paste inspection with SPC charts and offset feedback to the printer |
| `placement.html` | Dual-lane, dual-gantry pick-and-place |
| `reflow.html` | Reflow oven with a per-board thermal model |
| `aoi.html` | Optical inspection with defect detection and review |
| `handling.html` | Magazine loader and unloader, lane shuttle, merge with NG buffer |
| `building.html` | The plant hall on its own |
| `props.html` | The shared prop library used by the plant (a development page, not linked from the landing page) |

`index.html` is the landing page. The figures quoted in the page descriptions (cycle times, OEE, yield) are model parameters and outputs of the simulation, not measurements of a real plant.

## Layout

```
src/core.js, src/line.js     renderer, scheduler, views; boards, machine base class, SMEMA handoff, lines
src/machines/<kind>.js       one module per machine type
src/factory/*.js             building, areas, props
src/pages/<page>.html        development page with relative <script>/<link> tags (opens from file://)
src/pages/<page>.page.js     page script
src/shell.*, src/pcbkit.js   shared side panel and the demo board
src/vendor/                  three.js r147, OrbitControls, BufferGeometryUtils (see THIRD_PARTY_NOTICES.md)
build.py                     inlines every src/pages/*.html into dist/<page>.html
tools/check.py               headless Chrome check of a built page (see below)
briefs/, reports/, reference/  working notes from how the suite was built
```

`dist/` is committed, because it is what the Pages site serves. Change `src/`, run `python3 build.py`, and commit the result with it. The module contract is in [briefs/CONTRACT.md](briefs/CONTRACT.md) and file ownership in [briefs/OWNERS.md](briefs/OWNERS.md).

## Development

```sh
python3 build.py                        # all pages  -> dist/
python3 build.py printer aoi            # selected pages
python3 -I tools/check.py dist/printer.html --ff 120    # headless check, exits 1 on a page error
```

`tools/check.py` needs Google Chrome and Python Playwright (`pip install -r .github/requirements-test.txt`). It loads a page with software WebGL, optionally fast-forwards the simulation (`--ff` sim-seconds), prints a JSON summary of `window.__sim`, and can take screenshots (`--shot`, `--views`). `tools/thumbs.py` additionally needs Pillow.

CI rebuilds `dist/`, fails if it differs from what is committed, and runs `tools/check.py` on every page. See [CONTRIBUTING.md](CONTRIBUTING.md) for branches and releases, [SECURITY.md](SECURITY.md) for reporting vulnerabilities, and [CHANGELOG.md](CHANGELOG.md) for history.
