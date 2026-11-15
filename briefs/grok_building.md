# Brief for Grok — FACTORY building + areas (new)

You are one of several agents building the "SMT Factory Suite" in <repo> (absolute paths only; never write outside it).
The coordinator (Claude) integrates everything; other agents work on other files at the same time, so write ONLY the files assigned to you.
Mandatory reading before you write code, in this order:
  1. <repo>/briefs/CONTRACT.md  (module contract — coordinates, core API, SMEMA handoff, performance, verification)
  2. <repo>/src/core.js and <repo>/src/line.js (the framework you build on; do NOT edit them — implement locally and list "core requests")
  3. <repo>/src/machines/printer.js + <repo>/src/pages/printer.html + printer.page.js (reference module + page, ported from the user's original)
  4. the task-specific sources named below.
The user's original three pages are in <repo>/reference/ (PRINTER/PLACEMENT/AOI_original.html, plus *.custom.html = same files without the inlined three.js).
Their visual language (dark-gray / white themes, blue accent #1e6fd9, side panel, HUD, insets, bottom bar, signal towers, canvas operator monitors) must be kept.
The user asked: make the machines MORE COMPLEX, MORE PRECISE, MORE REALISTIC, add more details, and eventually build a factory plant with them.
Generic machines only: no brand names or logos. Units mm, Y up, X = board flow, front = +Z, board bottom at y=900, lanes z=+170 (1) / -170 (2).
Use simulation time C.T.sim for all logic. Mark animated objects with C.dyn and call C.bake(group) at the end of construction.
Build with: python3 <repo>/build.py <page>   Check with: python3 -I <repo>/tools/check.py <repo>/dist/<page>.html --ff 600 --views <v1,v2,...> --outdir <repo>/shots/<page>
Then LOOK at every screenshot with the Read tool (dark theme, and once with --light) and iterate until it is right. 0 page/console errors is mandatory.
Keep code compact and in the existing style (dense one-line helpers are fine). No external network resources.
RESUME NOTE: a previous builder for this same task was cut off by a usage limit after 7-15 tool calls. Files you own may already exist
in a partial state (written by that builder). Read them first; keep what is correct and complete the task — do not restart from zero
unless the partial file is broken beyond repair. Note: src/core.js now also has C.snapCam() and view functions may return a follow(rdt) callback.

TASK: build the PLANT BUILDING and its non-line areas for the factory page (the SMT lines themselves are placed later by the
coordinator). Two files: building.js defines window.SMT_FACTORY = window.SMT_FACTORY || {} and SMT_FACTORY.building(C, opts) -> hall info;
areas.js defines SMT_FACTORY.areas(C, hall, opts) that furnishes the areas and animates people + AMRs.
Props: another agent (OpenCode) is writing <repo>/src/factory/props.js = window.SMT_PROPS with functions documented in
<repo>/briefs/opencode_props.md (palletRack, pallet, esdBench, dryCabinet, reelTower, reelShelf, feederCart, stencilRack, pasteFridge,
lockers, fireExtinguisher, firstAid, sign, person, trolley, magazine, amr, forklift, palletJack, testStation, xray, selectiveSolder,
compressor, airReceiver, airDryer, n2Generator, desk, officeChair, meetingTable, whiteboard, andonBoard, turnstile, wasteBins, reworkStation).
Use them when present (typeof SMT_PROPS!=='undefined' && SMT_PROPS[name]); otherwise draw a simple labelled placeholder box of the documented
size (so your page works before props.js exists). Include ../factory/props.js in building.html anyway (it may not exist yet — guard it:
the build inlines only existing files, so check the file exists before referencing it; if it does not exist yet, leave the script tag out and
re-add it when it appears).
Hall (world mm, origin at hall centre on the floor): interior 72 m (X: -36000..36000) x 42 m (Z: -21000..21000), eaves 8000, ridge 9500.
Steel portal frames every 6 m (13 frames: columns HEA-400-like at both long walls, tapered rafters, haunches), purlins, roof cladding,
2 skylight strips (emissive light panels), LED high-bay luminaires in a grid (emissive discs + only 2-4 real lights), sandwich-panel walls
with horizontal seams and a window band at 3.5-5 m, 3 dock doors with dock levelers on the west wall (x=-36000), personnel + emergency exit
doors with green exit signs, fire extinguishers + first-aid at columns.
IMPORTANT for lighting: roof, walls and overhead services must have castShadow=false (the core sun light casts shadows through the roof
otherwise); only floor-standing objects cast shadows.
Floor: grey epoxy, ESD epoxy (grey-green) inside the EPA, yellow 100 mm walkway lines, zebra crossings, EPA boundary yellow/black tape with
"ESD PROTECTED AREA" floor signs, line footprints left free.
Zones (world X ranges, Z within the hall): goods-in/out warehouse x -36000..-23000 (pallet racks 5 m high, pallets, forklift moving between
dock and racks); component store + kitting x -23000..-16500 inside the EPA (reel towers, dry cabinets, reel shelves, feeder carts, feeder
setup bench, stencil racks, paste fridge, MSL bake oven placeholder); SMT lines x -16000..+8000 (two lines: LINE 1 centre z=+3600, LINE 2
centre z=-3600, each from x=-15500 to about +4000, machines up to 2400 deep; keep z 2200..5000 and -5000..-2200 free for machines, aisles
between); post-SMT x +8000..+22000 (rework benches, BGA rework, X-ray, selective solder, ICT/FCT test stations, final QC benches);
packing + shipping x +22000..+36000 (packing benches, pallets, racks). Offices + meeting room along the north wall (z 15000..21000,
x 8000..30000, glass partitions = dark tinted, desks, chairs, meeting table, whiteboard); ESD entrance with lockers + turnstiles on the
south side near x=-10000 (z -21000..-17000); utility room on the north wall x -12000..-2000 (z 16000..21000): compressor, dryer, air
receiver, N2 generator, with a blue compressed-air ring main (dia 63) at 4.2 m and drops to every machine slot, and nitrogen piping to the
two reflow ovens. Cable trays (yellow, 300 wide) at 3.2 m above each line with drops; reflow exhaust ducts (two dia 150 stacks per oven ->
dia 400 main -> roof); sprinkler pipes (red) under the roof; 2 large spiral HVAC ducts with diffusers.
Line machine slots for drops/trays (line-local centre X relative to the line start x=-15500, depth): loader 800/1000, printer 2600/1840,
spi 4000/1300, shuttle 5200/1200, placementA 6700/2332, placementB 8300/2332, conveyor 9500/900, reflow 13000/1450 (length 5800),
conveyor 16300/900, aoi 17400/1500, merge 18700/1200, unloader 20200/1000. Accept opts.slots to override.
Andon boards (SMT_PROPS.andonBoard) hanging above each line; return them in hall.andons so the factory page can draw live KPIs.
People: 10-14 operators (SMT_PROPS.person) — some walking along aisle paths (smooth walk animation: legs/arms swing, turn at corners),
some standing at benches/lines; 2 AMRs (SMT_PROPS.amr) driving loops between the component store and the line starts / line ends and
post-SMT; 1 forklift in the warehouse. Animate with C.onFrame using sim time (C.T.sim), paths as polylines; expose hall.movers.
Performance: InstancedMesh for repeated structure (columns, purlins, lights, rack uprights), C.bake each area group, keep the building page
<= 2500 draw calls at the overview. Return hall = {size, zones:{name:{x0,x1,z0,z1}}, lines:[{id,x0,z}], andons, movers, views}.
Preview page 'building': SMT3D.init({camPos:[-52000,30000,52000],camTgt:[0,0,0],maxDist:140000,far:300000,shadow:9000,shadowFar:40000,
esdLines:false,contactShadow:false,followShadow:true}); SMT_LINE.install(C); const hall=SMT_FACTORY.building(C,{}); SMT_FACTORY.areas(C,hall,{});
draw the two line footprints as translucent-looking flat boxes (opaque dark, 10 mm high) with labels; views: plant (overview), warehouse,
store, lines, postsmt, offices, utility, entrance, walk (eye height 1650 along the main aisle); side panel listing the zones.

Files you own (write only these): <repo>/src/factory/building.js, <repo>/src/factory/areas.js, <repo>/src/pages/building.html, <repo>/src/pages/building.page.js (optional <repo>/src/pages/building.css).

You run on the user machine, so you CAN run the build and the headless Chrome check yourself (tools/check.py uses playwright with channel=chrome). Look at the PNG screenshots you produce.

Final answer = a concise report: files written; features implemented (bullet list); camera views; measured numbers
(cycle time per board, boards/h, draw calls from the check summary "render.calls"); screenshots paths; known issues; core requests
(exact code you would like added to core.js/line.js, if any).
Write the report to <repo>/reports/grok_building.md and finish with the line GATA BUILDING.
