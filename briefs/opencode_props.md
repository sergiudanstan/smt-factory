# Brief for OpenCode — factory props library (mechanical modelling task)

Working folder: `<repo>` (absolute paths only; do not touch anything outside it).
Read first: `briefs/CONTRACT.md` (sections "Coordinates", "The core object C", "Performance"), then `src/core.js`
(helpers `C.std`, `C.box`, `C.cyl`, `C.label`, `C.plate`, `C.canvasTex`, `C.emissive`).

## Files you own (write ONLY these)
`src/factory/props.js`, `src/pages/props.html`, `src/pages/props.page.js`, `reports/opencode_props.md`.

## What to build
`src/factory/props.js` defines `window.SMT_PROPS` — an object of functions `name(C, opts) -> THREE.Group`.
Rules for every prop:
* Units mm, Y up. Origin = bottom centre on the floor (y = 0). The FRONT of the prop faces +Z.
* Use only `C.box`, `C.cyl`, `C.label`, `C.plate`, `C.canvasTex` and plain THREE geometries (Box, Cylinder, Sphere,
  Capsule, Torus, Plane). No external textures, no transparency (fake glass = dark tinted MeshStandardMaterial,
  color 0x1d2a36, roughness .08, metalness .6).
* Materials must be SHARED between calls (the area builder later merges geometry per material): create them through
  one cache at the top of the file, e.g. `const _m={}; const mat=(C,key,color,rough=.6,metal=0)=>_m[key]||(_m[key]=C.std(color,rough,metal));`
* Props that move (person, amr, forklift, palletJack) set `group.userData.dynamic = true` and expose their moving
  sub-groups in `group.userData` as listed below. Static props never set it.
* Dimensions below are exact; small details (handles, feet, labels, screws) are welcome but keep each prop under
  ~150 meshes (use InstancedMesh for >20 identical items such as reels, boxes, bins, nozzles).

### Props (signature — size W x D x H in mm unless stated — content)
1. `palletRack(C,{bays=3,levels=4,bayW=2700,depth=1100,height=5000,loads=true})` — uprights 90x70 section blue 0x1f4fa0
   at each bay boundary (front + rear), horizontal + diagonal bracing between front/rear uprights, beam pairs 130x50
   orange 0xe8731a at y = 150, 1500, 2850, 4200 (levels), footplates 150x150x10. If loads: on every beam level 3 EUR
   pallets per bay (call `pallet` with loaded=true, random heights 600-1200), first level on the floor too. Load sign
   plate "MAX 1000 kg / LEVEL" on the first upright.
2. `pallet(C,{loaded=true,h=900})` — EUR pallet 1200 (X) x 800 (Z) x 144: 5 top deck boards 22 thick, 9 blocks
   145x100x78, 3 bottom boards; wood 0xc8a46e. If loaded: stacked cardboard boxes 0xb8915a (sizes 400x300x300 and
   600x400x300 in layers up to h), tape strips 0xd8c08a, one white shipping label per pallet.
3. `esdBench(C,{w=1500,d=750,shelf=true,monitor=true,solder=true,microscope=false})` — frame square tube 40x40 grey
   0x8a9097, worktop top surface at y=900 (30 thick) with light-blue ESD mat 0x5b8fb9 (4 thick, 20 inset), upright posts
   to y=1950 at the rear, shelf 300 deep at y=1500, LED light bar at y=1850 (emissive 0xffffff, 1.2), louvered panel
   with 3 rows of 6 small bins (120x170x80, blue/red/yellow), yellow-green ground snap on the front edge, drawer
   unit 400x600x620 under the left end, monitor 24" (540x320x40, dark screen with a light-blue UI label) on a stand
   if monitor, soldering station 150x100x120 with an iron holder if solder, stereo microscope (base + column + head) if microscope.
4. `dryCabinet(C,{w=600,d=700,h=1800,doors=1})` — body 0xd9dde1, door(s) with fake-glass panel and black handle,
   5 shelves with standing reels (330 diameter x 16, colours white / light blue / black), digital RH display label
   "2.1 %RH" (green on black) above the door, 4 casters 75 diameter.
5. `reelTower(C,{w=900,d=900,h=2050})` — smart reel storage tower: white body 0xeceff2 with dark-blue band 0x1d3f7a
   at y 1500-1650, 15.6" touch display (canvas label "REEL STORE · 1240 reels · 4 requests"), output slot door 420x120
   (dark) at y=1000, emissive green status ring, top fan unit with 2 grilles.
6. `reelShelf(C,{w=1800,d=400,h=2000,levels=5})` — light-grey steel shelving, reels standing on edge in rows
   (InstancedMesh, diameters 180 and 330, thickness 8-16, mixed white/blue/black with coloured label strip).
7. `feederCart(C,{slots=30})` — 650 (X) x 750 (Z) x 1000: steel frame on 4 casters, push handle at the rear, feeder
   bank on top: `slots` feeders 13 wide x 560 deep x 110 high (light steel 0xc9cdd2, dark cap), reels 180 diameter
   below on a reel holder, alternating two rows, coloured part labels.
8. `stencilRack(C,{n=12})` — mobile rack 1100 (X) x 800 (Z) x 900: n stencil frames standing in slots (736x736x30
   aluminium frame, stainless foil 0xb3b8bd inside, small white ID label each), 4 casters.
9. `pasteFridge(C)` — 600x620x1400 white fridge, fake-glass door, 4 shelves with paste jars (diameter 66 x 70, white,
   blue lid) and 6 cartridges (diameter 55 x 230, grey), display "4.2 °C".
10. `lockers(C,{n=6})` — n columns, each 300 W x 500 D x 1800 H, body 0x7b8794, doors with vent slots, handle and a
    number label 1..n.
11. `fireExtinguisher(C)` — red cylinder 160 x 550 on a wall bracket (centre y=900), red sign 200x200 above at y=1600.
    `firstAid(C)` — green box 400x150x300 with a white cross, at y=1300. `sign(C,{text='EXIT',w=600,h=200,bg='#1f9e55',fg='#ffffff'})`
    — a flat plate (use `C.plate`) whose bottom edge is at y=0 (caller positions it).
12. `person(C,{smock='#2f6fb5',trousers='#2a2f38',skin='#d9a77f',pose='stand'})` — 1750 tall operator: legs and arms
    as capsules on pivot groups at hip (y=900) and shoulder (y=1450), torso (ESD smock) 420 wide, head sphere
    diameter 220 at y=1620, shoes. `userData={dynamic:true,legs:[l,r],arms:[l,r]}` (pivot groups, rotate x to walk).
13. `trolley(C)` — 900x500x950 shop trolley, 2 shelves, handle, 4 casters.
14. `magazine(C,{fill=0.6})` — SMT board magazine 320 (X, board flow) x 355 (Z) x 563 (Y): two black ESD side plates
    with 50 slot grooves at 10 mm pitch, top + bottom plates, top handle. Boards inside as ONE InstancedMesh of green
    0x0f5a31 boxes 250 x 1.6 x 200, the lowest round(fill*50) slots filled.
15. `amr(C,{top='magazine'})` — autonomous mobile robot 890 (X) x 580 (Z) x 350: light-grey body, black bumpers,
    emissive blue LED strip around the body, 2 lidar pucks on opposite corners, top = 'magazine' (roller-conveyor top
    module 300 high carrying 2 `magazine` props) | 'cart' (towing hook) | 'none'.
    `userData={dynamic:true,leds:<the LED material>,top:<top group>}`.
16. `forklift(C)` — electric counterbalance forklift 2000 (X) x 1000 (Z) x 2100 (overhead guard), yellow 0xf2b800,
    black counterweight, mast height 2200 at the front (+X), forks 1150 long. `userData={dynamic:true,forks:<group>}`.
17. `palletJack(C)` — manual pallet truck, forks 1150, handle. `userData={dynamic:true}`.
18. `testStation(C)` — 19" rack 600x800x2000 dark grey with instrument fronts (labels + small emissive dots), next to
    it a table 1200x800 (top at 900) with a pneumatic test-fixture press (frame 600x500x900), monitor, keyboard.
19. `xray(C)` — X-ray inspection cabinet 1400 W x 1300 D x 1950 H, light grey, yellow radiation warning triangle
    sticker, dark lead-glass window, keyboard tray, monitor arm with 2 monitors on the right side, signal light on top.
20. `selectiveSolder(C)` — 2100 (X) x 1600 (Z) x 1650 machine, dark grey 0x3a4048 with blue accent, fake-glass window,
    exhaust stub diameter 150 on top, signal tower, monitor, SMEMA openings at both X ends (board height 900).
21. `compressor(C)` 1500x900x1500 screw-compressor cabinet; `airReceiver(C)` vertical tank diameter 1100 x 2600 on 3
    legs with gauge and valve; `airDryer(C)` 800x700x1100; `n2Generator(C)` skid 1800x900 with 2 columns 300 x 1800,
    control panel and a buffer tank 600 x 1600.
22. `desk(C)` 1600x800x740 with monitor + keyboard; `officeChair(C)`; `meetingTable(C,{seats=8})` with chairs;
    `whiteboard(C)` 1800x1200 on legs.
23. `andonBoard(C,{w=1600,h=900,hang=0})` — black-framed screen; the screen is a `MeshBasicMaterial({map:tex,toneMapped:false})`
    with a 1024x576 canvas. `userData={ctx,tex}` so the caller can draw live KPIs. If hang>0, two rods of that length upward.
24. `turnstile(C)` — ESD tester gate: pillar 300x300x1100 with a foot-plate 600x400x20, hand contact plate, green/red
    LEDs, tripod arms.
25. `wasteBins(C)` — three 60 l bins (blue / yellow / black) with lids.
26. `reworkStation(C)` — BGA rework machine on an `esdBench`: base 700x650x250, top heater on an arm, camera optics.

## Gallery page (for verification)
`src/pages/props.html`: copy the structure of `src/pages/printer.html` but with a minimal body: keep `<aside id="side">`
with only the title, theme buttons and a short note, and in `<main id="stage">`: `<canvas id="c"></canvas>`,
`<div id="tags"></div>`, `<div id="bar" class="panel"><button data-v="all" class="on">All</button>
<button data-v="row1">Row 1</button><button data-v="row2">Row 2</button><button data-v="row3">Row 3</button>
<button id="bLab">Labels</button></div>`. Scripts: shell.js, three, OrbitControls, BufferGeometryUtils, pcbkit.js,
core.js, line.js, ../factory/props.js, props.page.js.
`src/pages/props.page.js`: `const C=SMT3D.init({camPos:[0,9000,16000],camTgt:[0,800,0],maxDist:40000,shadow:12000,shadowFar:30000,esdLines:false,contactShadow:false}); SMT_LINE.install(C);`
then place every prop in rows of 6 with 3500 mm spacing (big ones like palletRack get their own slot), a floor label
under each (`C.label(scene,name,1600,180,x,2,z+1300,{rx:-Math.PI/2,bg:'#1e6fd9'})`), `C.tag(name,group,0,height+200,0)`,
views all / row1 / row2 / row3 via `C.addViews`, then `C.start()`. Animate the person (walk swing) and the AMR LEDs
in `C.onFrame` so the userData hooks are proven to work.

## Verification (must pass before you finish)
1. `node --check src/factory/props.js` and `node --check src/pages/props.page.js`
2. `python3 build.py props`
3. `python3 -I tools/check.py dist/props.html --views all,row1,row2,row3 --outdir <repo>/shots/props`
   -> must print `errors: 0`. Look at the four PNGs (they are in shots/props) and fix floating, intersecting or
   missing parts.
4. Write `reports/opencode_props.md` (list of props, any deviation from the spec), then print the line `GATA PROPS`.
