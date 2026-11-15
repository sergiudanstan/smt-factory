# SMT Factory Suite — module contract (read this first)

Project root: `<repo>` (absolute paths only; never write outside it).
Goal: three upgraded single-machine pages (PRINTER, PLACEMENT, AOI) plus the missing line machines
(LOADER, SPI, SHUTTLE, REFLOW, MERGE/NG BUFFER, UNLOADER) and one FACTORY page where the same
modules run together as complete SMT lines inside a plant building. Everything is plain JavaScript on
**THREE r147 (global `THREE`)**, one self-contained HTML file per page (no network, opens via file://).

## Files and load order
```
src/vendor/three.r147.min.js, OrbitControls.js, BufferGeometryUtils.js   (do not edit)
src/shell.css, src/shell.js      shared side panel / theme / overlay shell   (do not edit)
src/pcbkit.js                    makePCBKit(): the one demo board (250x200x1.6 mm, 289 parts) (do not edit)
src/core.js                      SMT3D: renderer, scene, lights, helpers, scheduler, views, insets, tags (owner: coordinator)
src/line.js                      SMT_LINE: Board, machine base, SMEMA handoff, lines, stubs  (owner: coordinator)
src/machines/<kind>.js           one machine module each (owners: see your brief)
src/factory/*.js                 building, areas, props, dashboard
src/pages/<page>.html            dev page (relative <script src>), works directly via file://
src/pages/<page>.page.js         page script (builds the scene for that page)
build.py                         python3 build.py [page...]  -> dist/<page>.html (all scripts inlined)
tools/check.py                   python3 -I tools/check.py dist/<page>.html [--ff 300] [--views a,b] [--outdir DIR] [--shot FILE] [--light]
reference/                       original user files, read-only
```
Page script order in every page: `shell.js, three, OrbitControls, BufferGeometryUtils, pcbkit.js, core.js, line.js, machines..., <page>.page.js`.
If you need a change in core.js / line.js, do NOT edit them: implement it locally in your module and list
the request under "core requests" in your report. The coordinator merges core changes.

## Coordinates and units (non-negotiable)
* Millimetres. Y up. X = board flow, left -> right. Z toward the operator (front = +Z).
* Conveyor: **board bottom at y = 900** (`C.CONV_Y`), board top at 901.6. Lanes at **z = +170 (lane 1, front)** and
  **z = -170 (lane 2, rear)** (`C.LANE_Z`). Board 250 (X) x 200 (Z) x 1.6 (`C.BW, C.BD, C.BT`).
* Every machine is built in a THREE.Group whose origin is the machine centre on the floor; `group.position.x = opts.x`,
  and the group is added to `C.parentFor(opts)` (the line root). Line roots are only translated, never rotated.
* Positions inside a line are *line-local*. `m.world(lx)` converts machine-local X to line-local X (boards move in
  line-local X). For world-space things (insets, camera presets) use `m.origin()` (world Vector3 of the machine origin).

## The core object `C` (from `SMT3D.init(cfg)`, extended by `SMT_LINE.install(C)`)
Helpers: `C.std(color,rough,metal,extra)`, `C.box(parent,w,h,d,mat,x,y,z,{cast,recv,rx,ry,rz})`,
`C.cyl(parent,r1,r2,h,mat,x,y,z,{seg,rx,ry,rz,open,cast})`, `C.label(parent,text,w,h,x,y,z,{bg,fg,pw,size,rx,ry,rz})`,
`C.plate(parent,lines[],w,h,x,y,z,{bg,fg,border,align,rx,ry})` (nameplates / warning stickers), `C.canvasTex(w,h,draw,{repeat})`,
`C.emissive(color,intensity)`, shared materials `C.M.{alu,aluD,steel,black,dark,red,white,blue,camBlue,glassLens,copper,rubber,yellow,green,orange,cable,hose,brass}`,
`C.NOSH` = `{cast:false}`. Shared demo board: `C.KIT` (`KIT.inst`, `KIT.board`, `KIT.compsAll`, `KIT.compsNoCand`, `KIT.cands`,
`KIT.places`, `KIT.pads`, `KIT.pasteGeo()`, `KIT.partGroup(place)`), `C.FIDS` (3 fiducials, board-local mm), `C.FLAT(w,d)`.

Time: everything runs on **simulation time** `C.T.sim` (seconds). Never use `performance.now()`/`Date` for logic
(only for cosmetic blinking). Speed and pause are global (`C.T.speed`, `C.T.paused`).
Scheduler: `C.run(generatorFn())` starts a coroutine; inside: `yield seconds` (wait), `yield C.FRAME` (next sub-step),
`yield* C.tween(dur, k=>..., linear)`, `yield* C.waitUntil(()=>cond)`. Coroutines are stepped in sub-steps of <= 20 ms
(and coarser, e.g. 50 ms, during fast-forward) — logic must be robust to that.
Callbacks: `C.onTick(f(h))` logic per sub-step (also during fast-forward); `C.onFrame(f(dt,rdt))` visuals per rendered
frame (dt = sim seconds, 0 when paused; rdt = real seconds); `C.onHud(f)` every 80 ms; `C.onSlow(f)` every 200 ms.

Performance (mandatory): mark every object whose transform/visibility you animate with `C.dyn(obj)` (its whole
subtree is then left alone), then call `C.bake(machineGroup)` once at the end of construction: it merges all other
static meshes per material into a few draw calls. Material property animation (emissive, opacity, map updates) is fine
on baked meshes. Transparent materials and layer-1/2 meshes are never baked. `C.lod(obj, maxDistMm)` hides heavy
cosmetic detail when the camera is far. `m.near` (bool, camera within ~7 m) — skip canvas-monitor redraws when false.
Targets: a single-machine page <= ~600 draw calls; one machine inside the factory <= ~250 calls when far away.

UI/camera: `C.addViews({name: fn})`, `C.flyTo(pos[], target[])`, `C.setView(name)`, `C.tag(text,obj,x,y,z)` (HTML labels
shown with the Labels button), `C.clickable(obj, handler)` (hoods, doors), `C.shellMats` (push outer-cover materials:
X-ray button makes them transparent), `C.inset(elementId, camera, prepare(cam), overrideMaterial?)` renders what a machine
camera sees into an overlay panel. `C.expose({...})` adds to `window.__sim` (automation / tests).

## Line layer (`SMT_LINE.install(C)` adds these to C)
* `new C.Board(lane, lineLocalX, line)` — the board entity. `b.setX(x)`, `b.setLane(l, snap=true)`, `b.g` (Group in the line
  root), `b.stage` in `bare -> printed -> placed -> reflowed`, `b.setStage(s)` (switches paste / assembled parts / reflowed
  solder visuals), `b.addDefect(k, type, source)` (k = index into `KIT.cands`, types per `C.DEF[kind]` plus solder-level
  'BRIDGE','INSUFFICIENT','OPEN'), `b.defects[]`, `b.mark(d)` (red frame, layer 1), `b.result` ('OK' | 'NG' | 'FC' false call),
  `b.spi` (free-form SPI data), `b.history[]`, `b.dispose()`. Boards are expensive: dispose boards once stored in a
  magazine and show magazine contents with instancing.
* `C.machine(def)` creates the machine base `m`. Required def fields: `id, name, kind, group, x, length (body X mm),
  depth, height, lanes`, plus `line: opts.line`. Optional: `lanesIn`, `lanesOut` (default `lanes`), `inReach`, `outReach`
  (how far the machine's own conveyor rails stick out of the body on the in / out side, mm; the factory layout uses
  them to space machines), `parallel` (boards processed in parallel, for bottleneck maths), `spec{}`.
  The base gives: `m.state` + `m.setState(state, step, detail)` with states **RUN, IDLE, STARVED (waiting for upstream),
  BLOCKED (waiting for downstream), DOWN (alarm), SETUP**; `m.stateTime`, `m.gantt`, `m.counters{in,out,ng}`,
  `m.endCycle(b, t0)`, `m.ct`, `m.cts`, `m.avgCt()`, `m.util()`, `m.addLog(text, cls)` (cls: 'ok' | 'ng' | 'cl'),
  `m.log[]`, `yield* m.fault(text, seconds)` (alarm: DOWN, red tower, log, auto-recover), `m.near`, `m.camDist`, `m.origin()`.
* SMEMA handoff (the line controller calls these; modules implement the `on*` hooks):
  - `m.canAccept(lane, board)` -> bool: may the upstream machine push a board on this lane now?
  - `m.onAccept(b, lane)` — you now own `b` (it sits at the upstream exit); convey it in (`yield* C.conveyTo(b, m.world(x), belt)`).
  - when a board is finished and sits at your exit: `m.setReady(b, lane)`.
  - `m.onRelease(b, lane)` — the downstream machine took it (its `onAccept` moves it on); free your exit.
  A machine finds its downstream partner automatically: the next machine (by X) in the same line whose `lanesIn`
  contains the lane. The last machine of a line (unloader / sink) calls `m.line.finished(b)`.
* Conveyors: `C.belt(repeat)` -> `{tex, mat, moving}` (texture scrolls while `moving>0`), `C.railSeg(parent,x0,x1,z,{belt})`
  (standard rails, local coords), `C.stopper(parent,x,z)` (pin; set `pin.userData.up`), `C.conveyTo(b, x, belt, speed)`
  (generator, default `C.BELT_V` = 330 mm/s), `C.linkConveyor({x,length,lanes,line})`.
* Stubs for stand-alone pages: `C.source({x,length,depth,lanes,label,stage:'bare'|'printed'|'placed'|'reflowed',interval,line})`,
  `C.sink({x,length,depth,lanes,label,line,onBoard})`. Then `C.line.connect(); C.start();`.
* Signal tower: build three lamp materials `{r,y,g}` (MeshStandardMaterial with emissive) and call `C.tower(m, tw, warn)`
  every frame (green = RUN, amber = waiting, amber blinking = warning, red blinking = DOWN).
* Lines: `C.line` (default line at the origin), `C.newLine({id,name,x,z})` for more lines, `C.lines`, `C.machines`.

## A machine module
```js
SMT3D.register('printer', function (C, opts) {      // opts: {x, line, id, name, standalone, ...module options}
  const machine = new THREE.Group(); machine.position.x = opts.x || 0; C.parentFor(opts).add(machine);
  /* ... geometry (static into machine/interior groups; animated parts in their own groups, C.dyn(them)) ... */
  const m = C.machine({id: opts.id || 'printer', line: opts.line, name: 'PRINTER', kind: 'printer', group: machine,
                       x: opts.x || 0, length: 1180, depth: 1840, height: 1606, lanes: [1], inReach: 250, outReach: 250});
  m.canAccept = ...; m.onAccept = ...; m.onRelease = ...;  C.run(main());          // process, via setState(...)
  m.update = (dt, rdt) => { /* per-frame poses from state; C.tower(m, tower, warn) */ };
  m.info = () => [['Step', ...], ['Boards', ...]];       // rows for the factory side panel (strings / numbers)
  m.views = {name: {p: [x,y,z], t: [x,y,z], hood: 1}};    // camera presets RELATIVE to the machine origin
  m.cameras = [{name: 'Top camera', cam, prepare: c => {...world coords via m.origin()...}}];
  C.dyn(...animated); C.bake(machine);
  if (opts.standalone) { /* wire page HUD ids, buttons, C.addViews, C.inset, C.tag, monitor */ }
  return m;
});
```
`src/machines/printer.js` is the reference implementation of this contract (ported from the original page). Read it.
In the factory a module is built with `standalone:false`: no page-specific DOM, but `info()`, `views`, `cameras`,
operator monitors (only redrawn when `m.near`) and clickable hoods/doors must still work.

## Realism bar
Generic machine models (no brand names or logos), dimensions and process parameters from published data for the
machine class. Every machine needs: frame + covers with panel seams, hinges, handles, vents, feet/levelers, nameplate,
E-stop(s), signal tower, operator HMI (canvas monitor with live data), SMEMA transfer openings with conveyor rails,
cable ducts, pneumatics where the real machine has them, labels/warning stickers, interior mechanics that actually
move in the right sequence, realistic timing, alarms/consumables, and HUD numbers that are consistent with what
the 3D shows. Precision matters more than decoration: correct sequence, plausible numbers, no floating or
intersecting parts, no z-fighting, nothing visible that contradicts physics.

## Verification (do this before reporting)
1. `node --check` every file you wrote.
2. `python3 build.py <page>` then `python3 -I tools/check.py dist/<page>.html --ff 600 --views <all your views> --outdir <repo>/shots/<page>`
   -> 0 page errors / console errors, boards keep flowing (counters grow, no state stuck forever), render calls within budget.
3. Open the PNG screenshots (Read tool) and look at them critically, dark and `--light` theme. Fix what looks wrong.
4. Report: files, features, views, numbers (cycle time, calls), known issues, core requests.
