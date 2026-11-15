# Brief for Grok — HANDLING: loader, unloader, shuttle, merge (new)

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

TASK: build the board-handling equipment as NEW modules in ONE file (handling.js registers four kinds):
1. 'loader' — magazine loader at the start of the line (lanesOut [1]). ~1600 (X) x 1000 (Z) x 1250 (Y). Standard ESD magazines
   320 (X) x 355 (Z) x 563 (Y), 50 slots at 10 mm pitch. Upper magazine conveyor brings full magazines to a lift (elevator) that indexes
   slot by slot so each board is level with the line conveyor (board bottom 900); a pneumatic pusher pushes the board out onto the
   outfeed conveyor (to +X). Empty magazines are lowered to the lower conveyor and returned to the operator side. 3 full magazines in the
   buffer; when the buffer runs out the loader goes STARVED until 'magazines are replenished' (auto after 60 s in the stand-alone page;
   the factory may replace this with an AMR). Board release rate limited to one per 6 s minimum. The loader creates boards:
   new C.Board(1, m.world(x), m.line) — show magazine contents with InstancedMesh, not with Board objects.
2. 'unloader' — mirror of the loader at the end of the line (lanesIn [1]): fills empty magazines (elevator steps down 10 mm per board),
   full magazines go out on the lower conveyor; boards are disposed after insertion (b.dispose(), keep counts) and the magazine fill is
   shown with InstancedMesh. Calls m.line.finished(b) for every stored board. It is the last machine of a line.
3. 'shuttle' — lane splitter after the SPI (lanesIn [1], lanesOut [1,2]): ~1000 (X) x 1200 (Z). A conveyor segment on linear guides
   translates in Z between lane 1 (z=+170) and lane 2 (z=-170) (servo + belt + cable chain visible). Dispatch rule: send each board to
   the lane whose downstream partner can accept first (alternate when both can). Boards with b.spi && b.spi.ng go to an NG reject
   position instead: the segment moves to z=+520 where a reject rack (10 slots) receives them (operator empties it every ~10 min:
   dispose + log). Update b.setLane(l, false) while animating b.g.position.z yourself.
4. 'merge' — lane merger + NG buffer before the unloader (lanesIn [1,2], lanesOut [1]): same translating segment, OK boards (b.result!=='NG')
   go to lane 1 out; NG boards (b.result==='NG') are pushed into a vertical NG buffer magazine (20 slots) at the rear where an operator
   at the repair/verification station takes them (every ~8 min: dispose + log + count real defects vs false calls from b.aoi).
All four: frame + covers in the suite style (white/dark grey, blue accents), clear polycarbonate-look top covers (fake glass, not transparent
-> dark tinted), signal tower, small HMI panel (canvas), E-stop, SMEMA connectors, levelling feet, labels; correct SMEMA behaviour
(STARVED/BLOCKED states, setReady/onRelease). Expose m.info(), m.views, and for loader/unloader m.replenish() / m.emptyFull()
hooks so the factory can call them (e.g. from an AMR).
Also register 'conveyor' — a better link/inspection conveyor than C.linkConveyor: options {length, lanes, inspection:true} adds a
work light + magnifier lamp for visual inspection, board-present sensors, SMEMA box, adjustable width rails, stoppers. Holds one board per lane.
Stand-alone page 'handling': a mini line — C.build('loader',{x:-3000}), C.build('shuttle',{x:-1500}) with a random 5 % of boards marked
b.spi={ng:true} by the loader page option, C.build('conveyor',{x:0,length:1200,lanes:[1,2],inspection:true}),
C.build('merge',{x:1500}) (mark ~8 % of boards b.result='NG' in the conveyor page option to exercise the NG buffer),
C.build('unloader',{x:3000}); views per machine + overview; HUD showing each machine's state and counters; layout positions may be
adjusted so rails meet without overlap (use inReach/outReach).

Files you own (write only these): <repo>/src/machines/handling.js, <repo>/src/pages/handling.html, <repo>/src/pages/handling.page.js (optional <repo>/src/pages/handling.css).

You run on the user machine, so you CAN run the build and the headless Chrome check yourself (tools/check.py uses playwright with channel=chrome). Look at the PNG screenshots you produce.

Final answer = a concise report: files written; features implemented (bullet list); camera views; measured numbers
(cycle time per board, boards/h, draw calls from the check summary "render.calls"); screenshots paths; known issues; core requests
(exact code you would like added to core.js/line.js, if any).
Write the report to <repo>/reports/grok_handling.md and finish with the line GATA HANDLING.
