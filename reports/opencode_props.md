# Report — factory props library (`opencode_props.md` brief)

Date: 2026-11-15 · Agent: OpenCode (GLM)

## Deliverables (only the four allowed files were written)

| File | Role | Size |
|---|---|---|
| `src/factory/props.js` | Prop library — `window.SMT_PROPS`, 34 builders | ~960 lines |
| `src/pages/props.html` | Gallery page shell | small |
| `src/pages/props.page.js` | Gallery layout (3 rows), camera views, animation hooks | ~80 lines |
| `reports/opencode_props.md` | This report | — |

Build: `python3 build.py props` → `dist/props.html` (778 KB).

## Props implemented (34)

- **row 1 — production/storage:** palletRack (3 bays, 45 pre-merged loaded pallets, grey
  backing placard + blue sign on the left upright), forklift (overhead guard, mast,
  moving forks, steering column + wheel ring, beacon, E-stop, ELECTRIC · 2500 kg plate),
  selectiveSolder (louvres, exhaust stub, signal tower, SMEMA openings, monitor on arm),
  xray (tunnel, two monitors X-RAY · VOIDS/ARCHIVE, 100 kV side plate), testStation
  (rack + FCT screen, rack labels at size .38), amr (LED strip, lidars, magazine top),
  reworkStation (BGA REWORK screen, fume arm).
- **row 2 — SMT storage:** reelShelf (5 levels seated), reelTower, dryCabinet, pasteFridge,
  stencilRack (stencils clear of floor, nameplate), feederCart, magazine (grooved side
  panels, handle, instanced PCB stack), lockers (n configurable), wasteBins, trolley,
  palletJack, pallet (loaded/h opts), person (walk-swing arms/legs hooks).
- **row 3 — utility/office:** esdBench (bins, microscope arm, MES screen, ESD label),
  turnstile (horizontal radial tripod arms, ESD label, LEDs), fireExtinguisher (sign,
  wall bracket, clamps, hose), firstAid, sign (wall kit), andonBoard (live canvas,
  hung), compressor, airReceiver (500 l tank, safety valve, drain, 11.2 bar gauge
  label), airDryer (grilles, two hoses), n2Generator (blue vessels + pipes), desk
  (dashboard screen), officeChair, whiteboard, meetingTable (seats: 8).

## Constraints compliance

- mm / Y up / origin bottom-centre on floor / front = +Z — all builders.
- Only `C.box / C.cyl / C.label / C.plate / C.canvasTex` + plain THREE geometries +
  `InstancedMesh` (PCBs, rack pallets via pre-merged `boxes()` helper → `C.BGU`).
- No external textures; no transparency anywhere — fake glass is opaque `0x1d2a36`.
- One shared material cache (`_m` / `mat()` / `emat()`); no per-prop material leaks.
- `userData.dynamic=true` only on person, amr, forklift, palletJack; static props never.
- Mesh counts per prop well under ~150 (heaviest — palletRack — uses merged geometry).

## Verification

- `node --check src/factory/props.js` ✓ · `node --check src/pages/props.page.js` ✓
- `python3 build.py props` → `dist/props.html` 778 KB ✓
- `python3 -I tools/check.py dist/props.html --views all,row1,row2,row3
  --outdir shots/props` → **errors: 0 warnings: 0**; 998 geometries, 103 textures,
  all four PNGs regenerated and inspected.
- Row-view cameras (steep 55–60° elevation) verified center-framing each row without
  occlusion: row1 `p:[0,25000,16000] t:[0,500,0]`; row2 `p:[0,23200,8800]
  t:[0,500,-6500]`; row3 `p:[0,27000,3550] t:[0,500,-13000]`; all
  `p:[0,24000,27000] t:[0,300,-6500]`.
- Close-up inspections (temporary `cu_*.png`, since deleted) passed for: stencilRack,
  reelShelf, magazine, esdBench, AMR, andon (live canvas), fireExtinguisher, forklift,
  airReceiver/airDryer (plates, gauge label, louvres), testStation rack labels, xray
  screens, turnstile (rebuilt arms), palletRack sign.
- Investigated and closed as non-issue: a dark diagonal "tube" seen near the airReceiver
  in the forklift close-up. Reproduced the exact camera: it is the forklift's steering
  wheel ring (torus, edge-on at that angle) on its tilted column, with the red E-stop
  below it — a correctly attached forklift part. Tank area confirmed clean from the
  front, right and row3 views.

## Fixes applied during review

- Plate-text overflow (C.plate sizes fonts by height only): shortened/split text or
  resized plates for palletRack sign, esdBench MES screen, fireExtinguisher, magazine,
  forklift, testStation FCT screen, xray monitors, selectiveSolder, compressor,
  airReceiver, airDryer, n2Generator, desk dashboard, turnstile ESD label, reworkStation.
- testStation rack labels → `C.label(..., size:.38)`; xray side plate → `X-RAY · 100 kV`.
- Turnstile tripod arms rebuilt as horizontal radial arms (`BoxGeometry(470,36,30)`,
  hub y=930, arms at 0/120/240°); ESD label and LEDs moved clear of the pillar face.
- palletRack load sign given a grey backing placard (uprights are at z=±515, a bare
  plate at z=0 floated); sign mounted on the outer face of the left upright.
- Gallery: `far:60000` in init opts, `window.__P=C` exposed before start, EXIT sign
  hung at y=2400, andon at y=2600.

## Deviations from the brief (deliberate)

- Gallery row pitch is not a uniform 3500: each prop takes its own slot width
  (≥2300/3500 for wide props such as palletRack 8600, meetingTable 5200, AMR 3500,
  magazine 700), so the row totals are 25300 / 17760 / 20350.
- Shared AMR LED material means all AMRs blink in phase (one cache, one material).
- Wall kits (sign, andon) carry slim backing panels and are positioned by the caller
  (y=2400 / y=2600) since props are floor-origin by contract.
- Pallet geometry inside the rack is pre-merged via `boxes()`/`C.BGU` to stay under the
  mesh budget; loose pallet prop is instanced boxes.
- A few plate texts shortened where height-based font sizing would overflow the width.

## Status

All brief items delivered and verified. Final check run: `errors: 0 warnings: 0`.
