# Brief for Codex — PLACEMENT module (port + upgrade)

Working folder: `<repo>` (absolute paths only; do not touch anything outside it).
Read first, completely: `briefs/CONTRACT.md`, `src/core.js`, `src/line.js`, `src/machines/printer.js` (reference module),
`src/pages/printer.html` + `src/pages/printer.page.js` (reference page).

## Files you own (write ONLY these)
`src/machines/placement.js`, `src/pages/placement.html`, `src/pages/placement.page.js`, `src/pages/placement.css`,
`reports/codex_placement.md`. Never edit core.js, line.js, shell.*, pcbkit.js, vendor/, other machines or pages.

## Source to port
`reference/PLACEMENT_original.html` is a dual-lane dual-gantry pick-and-place page built with a NEWER three.js
(r16x+, bundled + minified). Its application code, beautified, is `reference/placement.app.beautified.js`
(1175 lines; minified names). Its CSS and body markup are in `reference/placement.custom.html` (lines 7-200;
lines 100-143 are the placement-specific CSS; lines 146-200 the body). Screenshot of the original:
`shots/orig_placement.png` (if missing, the original renders as: white curved covers, two 30-slot feeder carts per
side with reels, two yellow-striped gantry beams, 2x8-nozzle heads, line cameras, timeline at the bottom).

Inferred alias map for the minified code (verify while reading):
`kp`=makePCBKit (`Zn` = the kit), `Ec`=window.SMT, `pe`=getElementById, `Yi`=clamp, `ur`=lerp, `_s`=smootherstep,
`ys`={deck,pcb (board top .9016 m),rest (nozzle rest z),tape}, `Fn`={feed: feeder pick row |y|, cam: line-camera |y|},
`Tc`=lane y [-.17,.17] (internal), `Fe`=board transfer params, `_p`={pick,place,scan} seconds, `vs`=16 nozzles,
`zo`=nozzle offsets (2 rows x 8), `vc`=heads (side -1 front / +1 rear), `od`=canvasTex, `Tp`=part types -> feeder slots,
`cr`=feeder cart geometry, `Yg`=feeder pick positions per side, `dr`=job (all 289 placements sorted by area, trip=i/16),
`Ho`=per head per part {src feeder, tPick, tPlace, mesh}, `hr`=per head schedule segments {t0,t1,kind,a,b,k,trip,zt,label,cmd},
`ed`=conveyor schedule, `we`=cycle time, `x1()`=schedule builder, `id(head,t)`=head pose, `Bg`=nozzle height,
`Oe`=machine group (rotation.x=-PI/2, scale 1000 -> metres, Z up), `xs(x,y,z)`=internal metres -> world mm
(x*1000, z*1000, -y*1000), `de`=MeshStandardMaterial factory, `ct`=materials, `Wo`=unit box geometry,
`Ht(w,h,d,mat,x,y,z,parent,shadow)`=box, `On`=cylinder along internal Z, `Mp`=cylinder along X, `td`=cylinder along Y,
`pr`=InstancedMesh from [{p,s,r,c}], `M1`=text plate, `Sp`=extruded side profile, `Xo`=covers group, `Zi`=doors,
`J1`=front/rear cover assemblies with monitors, `qo`=signal tower, `Ap`=cover mode solid/ghost/off, `wc`=door open/close,
`P1`=camera presets, `D1`=lane board map, `Rp`=timeline drawing, `U1(t)`=per-frame pose update, `c_`=RAF loop.
Three API differences to fix: `texture.colorSpace=SRGBColorSpace` -> `texture.encoding=THREE.sRGBEncoding`;
`scene.environmentIntensity` does not exist (set `envMapIntensity` ~.45 on materials); `mergeGeometries` ->
`C.BGU.mergeBufferGeometries`; physically-based light intensities (e.g. `.9*1000^1.4`) are wrong in r147 — use the
core's lights plus at most one interior `PointLight(0xeaf0ff, .8, 1800, 1)` per head side; renderer/scene/camera/
controls/floor/neighbour stubs come from the core (do not create them).
You may keep the internal metre / Z-up group (`Oe`, rotation.x=-PI/2, scale 1000) inside your machine group —
it saves rewriting the geometry. Boards and placed parts live in line-local mm (see contract).

## What the module must do (SMEMA, event driven — no global cyclic timeline any more)
`SMT3D.register('placement', (C, opts) => m)`. Body 1280 (X) x 2332 (Z) x 1444 (Y). `lanes:[1,2]`, `parallel:2`,
`inReach:150`, `outReach:150` (rails from x=-790 to +790 machine-local). Head F (front, side -1) serves lane 1
(z=+170), head R (rear) serves lane 2 (z=-170) — independent mounting, exactly as in the original.
Per lane three board positions (machine-local x): infeed wait -470, work 0 (clamped, support pins up), outfeed wait +470.
* `canAccept(lane)` = not DOWN and the lane's infeed-wait position is free.
* `onAccept(b,lane)`: convey to infeed wait (or straight to work if free); when the work position is free:
  convey to 0, stopper up, clamp (0.25 s), `b.setStage('placing')`.
* Each head runs its board schedule (built with the original `x1()` logic for this machine's job subset) on its own
  head clock. The first trip's picks may run before the board is clamped (as in the original); the head holds
  (clock frozen, state STARVED for that head) at the first fiducial/place segment until its lane's board is clamped.
* New segments to insert into the schedule builder (realism):
  - board fiducial recognition with the head's down-looking board camera: move to 2 fiducials (C.FIDS[1], C.FIDS[2]),
    0.15 s capture each, before the first place of the board;
  - nozzle change at an automatic nozzle changer (ANC) station on the bed (model it: a nozzle stocker plate with
    ~24 nozzle holes per head side) when a trip needs a different nozzle class (0402/0603 -> small, chips >=0805/SOT ->
    medium, ICs/ecaps/connectors -> large); ~0.6 s per change; count changes in the HUD;
  - recognition rejects: ~0.4 % of picks fail vision at the line camera -> the part is dropped into a dump box next to
    the line camera (model the box) and re-picked at the end of the trip (rebuild the schedule per board with fresh
    random rejects — the builder is cheap);
* Placed parts: placed part meshes are children of `b.parts` (`b.setStage('placing')` creates it), positioned in board
  coords. When the head finishes the board: `b.setComps(tpl)` where `tpl` is a merged Group of ALL parts placed so far
  on this board (upstream machines' parts + this machine's) — build it once at start-up by merging `KIT.places`
  geometry per material exactly like the kit's internal Bucket (each place: matrix rotY(rot) at (x, BT, z); each
  `[matName, geo, mtx]` of `place.ls`; material `KIT.PM[matName]`). If this machine finishes the job (`jobEnd===1`)
  call `b.setStage('placed')` instead (full `compsAll`). Then return the pool meshes for the next board.
* Job split: `opts.job = [start, end]` fractions of the sorted job list `dr` (default `[0,1]`). In the factory two
  machines run `[0,.62]` and `[.62,1]`. Parts before `start` are already on the incoming board.
* Placement defects (only the machine with `jobEnd===1`): per finished board with probability `opts.defectRate`
  (default 0.07) add one defect to a random candidate part (`KIT.cands`, type from `C.DEF[kind]` limited to
  MISSING / SHIFT / ROTATED / POLARITY) with source 'placement'.
* Feeders as consumables: every feeder reel has a quantity (8 mm: 5000 / 10000, 12-16 mm: 1500-3000, 24 mm+: 250-500);
  decrement on pick; at 3 % show a low-level warning (amber blinking tower, log); at 0 the head stops: `yield* m.fault('FEEDER F07 EMPTY — splice reel', 40)`
  then refill. Start reels at random 20-100 % so warnings happen within the first ~20 minutes.
* Outfeed: when the outfeed-wait position is free, unclamp, convey the finished board to +470, `m.setReady(b, lane)`;
  `onRelease` frees it. Machine state: RUN if any head works; STARVED if both heads wait for boards; BLOCKED if a finished
  board cannot leave; DOWN during a fault.
* `m.update(dt,rdt)` poses gantries/heads/nozzles from the head clocks (the original `id()`/`Bg()` math), animates
  feeder indexing (the original T1 logic), door hinges, covers mode, lamps via `C.tower(m, tw, warn)`.
* LOD: when `!m.near` hide the pool part meshes and the feeder sample parts (`C.lod` or check `m.near` in update).
* `C.dyn(...)` every animated group (beams, heads, nozzles, doors, pool parts, feeder samples, path lines) and
  `C.bake(machine)` at the end — target <= 600 draw calls for the stand-alone page.
* `m.info()`, `m.views` (relative presets: iso, front, side, top, gantry, board, pickf, pickr — converted from `P1`),
  `m.cameras` (Head F board camera looking down; line camera F looking up at the nozzles), `C.clickable(door, ...)`.

## Stand-alone page (`src/pages/placement.html` + `placement.page.js` + `placement.css`)
Same look and controls as the original: side panel (live stats, lane board maps, nozzle occupancy grids, legend,
machine spec table — add rows for nozzle changes, rejects, feeder alarms), HUD "now" rows per lane/head with the
current G-code-like command, cycle timeline canvas (now: the current board's schedule of each head with a playhead;
click-to-seek removed), bar with doors / covers / views / play-pause / speeds / path toggle. Map the original
play/speed buttons onto the core (`C.T.speed`, `C.setPaused`). Page script: `C.source({id:'spi',x:-1700,length:800,
lanes:[1,2],label:'FROM SPI  ▶',stage:'printed',interval:1})`, `C.build('placement',{x:0,standalone:true})`,
`C.sink({id:'reflow',x:1700,length:800,lanes:[1,2],label:'▶  TO REFLOW'})`, `C.line.connect(); C.start();`.
Default speed 1x (the original 0.5x looked slow); keep the speeds 0.25/0.5/1/2/5.

## Verification you can run (your sandbox cannot start Chrome — the coordinator runs the browser checks)
`node --check src/machines/placement.js src/pages/placement.page.js`, then `python3 build.py placement`.
Write a tiny node smoke test if useful, but do not install packages. Keep the original visual model unless the
brief asks for more. When done, write `reports/codex_placement.md` (what you built, how the schedule works, known
gaps) and finish your last message with the line: `GATA PLACEMENT`.
