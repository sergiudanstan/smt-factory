# HANDLING delivery

Owned outputs:
- <repo>/src/machines/handling.js
- <repo>/src/pages/handling.html
- <repo>/src/pages/handling.page.js
- <repo>/src/pages/handling.css (already present; not changed)
- <repo>/reports/grok_handling.md

`node --check` on both JS files exited 0. `python3 <repo>/build.py handling` wrote `<repo>/dist/handling.html`.

## Features

- `loader` — start of line, lanesOut [1], lanesIn []. Body 1600 × 1000 × 1490. ESD magazines 320 × 355 × 563, 50 slots at 10 mm, drawn with InstancedMesh (not Board objects). Upper conveyor, lift indexed so the live slot is at board-bottom y=900, pneumatic pusher to +X, empty magazines down to the return conveyor. Three full magazines in the buffer. `new C.Board(1, m.world(x), m.line)`. Release limited to one board per 6 s. `m.replenish(k)`, `m.info()`, `m.views`.
- `unloader` — mirror, lanesIn [1], lanesOut []. Lift steps down 10 mm per board. After insertion: `m.release`, `m.line.finished(b)`, `b.dispose()`. Full magazines leave on the lower conveyor. `m.emptyFull()`.
- `shuttle` — after SPI, lanesIn [1], lanesOut [1, 2], length 1100, depth 1300. Conveyor segment on linear guides, servo, belt, cable chain. Each board goes to the lane whose downstream partner can accept; the two lanes alternate when both can. `b.setLane(lane, false)` while the segment translates. `b.spi.ng` goes to a 10-slot reject rack (dispose, `counters.ng`, no `line.finished`).
- `merge` — lanesIn [1, 2], lanesOut [1], same segment. OK boards (`b.result!=='NG'`) leave on lane 1. NG boards go into a 20-slot buffer at the rear. Classification from `b.aoi`: real if `aoi.real>0` or `aoi.detected>0`, false call if `aoi.falseCalls>0` and not real, otherwise unverified. Conveyor-injected NG has no `b.aoi`, so it is neither.
- `conveyor` — `{length, lanes, inspection:true}`. Length comes from opts (default 1200; the factory passes 900). One board per lane. Inspection adds the arch, work light, magnifier rings, sensors, SMEMA, width handwheel, stoppers. Default dwell 0.45–0.8 s; pass `dwell:[12,25]` for a manual pace.
- All five: white / dark-grey frame, blue accent, dark opaque covers (they bake), signal tower, canvas HMI, E-stop, SMEMA, feet, labels. STARVED / BLOCKED, `setReady` / `onRelease`.
- Stand-alone page passes `standalone:true`, so auto-replenish (60 s) and rack collection run there only. Factory builds do not pass `standalone`, `auto`, `faults`, `dwell`, `spiNg`, or `ngRate`. Random faults run only with `opts.faults`. The page marks 5 % of boards `b.spi={ng:true}` only, and 8 % `b.result='NG'` plus `b.ngBy='INSP'` (no `b.aoi`).

Reaches match the factory DIMS currently on disk: loader 0/120, shuttle and merge 120/120, conveyor 0/0, unloader 120/0. Page centres: loader −2860, shuttle −1270, conveyor 0 (length 1200), merge 1270, unloader 2860. Neighbouring rails meet.

## Camera views

Page camera `[0, 3600, 9800]` looking at `[-60, 650, 0]`. Shadow 7000, shadowFar 16000, contact 10000 × 3000, ESD 11000.

Bar: over, ld_over, ld_lift, ld_buffer, ld_pusher, sh_seg, sh_drive, sh_reject, cv_over, cv_lamp, mg_seg, mg_ngbuf, ul_over, ul_lift. Every `m.views` key is also registered with the same prefix (out, low, top, rails, drive).

## Measured (last `--ff 600`, t = 601.26 s)

errors 0, warnings 0.

| | in | out | ng | note |
|---|---:|---:|---:|---|
| loader | 99 | 99 | 0 | avgCt 6.02 s |
| shuttle | 99 | 97 | 1 | rack 1/10, not yet emptied |
| conveyor | 97 | 96 | 0 | one board per lane |
| merge | 96 | 90 | 5 | buffer 5/20, real 0, false calls 0 (unverified) |
| unloader | 90 | 90 | 0 | stored 90, one full magazine out |

Line output 90 boards, 515.3 boards/h, WIP 3. `render.calls` on the last frame of that check (mg_ngbuf) is 151. A hood-open close-up of the same module (ul_lift) measured 175. The light-theme unloader view measured 270 because more of the line is in frame.

## Screenshots

Dark, 600 s: `<repo>/shots/handling/handling_over.png` and the `ld_*`, `sh_*`, `cv_*`, `mg_*`, `ul_*` files next to it.

Light theme (40 s, theme check): `<repo>/shots/handling/light/handling_over.png`, `handling_ld_lift.png`, `handling_sh_seg.png`, `handling_ul_over.png`.

## Known issues

- Reject and NG magazines are framed from the side. The green boards sit inside the dark magazine, so the stack is easier to read on the HMI (1/10 and 5/20) than in the mesh.
- Stoppers ease on the frame clock. After a fast-forward they can sit a few millimetres off the snapped pose until the next rendered frames. Cosmetic.
- The first rack collection waits period+180 s (shuttle 780 s, merge 660 s) so a 600 s shot still contains boards. Later collections stay at 10 min and 8 min.
- `render.calls` is whatever the last screenshot was looking at, not a separate overview pass.

## Core requests

None. Loader, unloader, shuttle, merge and conveyor are local modules. Nothing in core.js or line.js had to change.
