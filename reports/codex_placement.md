# PLACEMENT delivery

Owned outputs:
- <repo>/src/machines/placement.js
- <repo>/src/pages/placement.html
- <repo>/src/pages/placement.page.js
- <repo>/src/pages/placement.css
- <repo>/reports/codex_placement.md

## Implementation

Ported the original curved covers, hinged doors, monitors, feeder carts/reels, yellow gantries, 2×8 nozzle heads and line cameras to THREE r147. Retained the metre/Z-up internal model; boards and component pools use millimetres. Removed the original renderer, floor, neighbour stubs, duplicated boards and cyclic RAF timeline.

Each lane has an incoming buffer (-470), clamped work nest (0), and outgoing buffer (+470), with native SMEMA callbacks. Heads pre-pick while awaiting a board; their schedules freeze before the first board-camera move until their board is clamped. Lane processes run independently. Congestion retains the completed work board until its exit becomes free.

Schedules retain x1 distance timing, feeder-X picks, line-camera scans, board-X placements and the original smootherstep/sinusoidal pose math. Added per-nozzle classes and 0.6-second ANC changes, 24 stocker sockets per side, two 0.15-second fiducial captures, fresh 0.4% vision rejects, reject bins and inspected replacement picks at each trip's end. Retries are accepted after their second scan.

The job is sorted before fraction slicing: the factory split is 179 + 110 = 289 placements. Startup material-bucket templates include upstream parts and completed trips. Current-trip parts use reusable meshes; completed trips switch to merged templates. Final machines setStage('placed') and optionally add a supported placement defect.

All 120 reel positions have inventory; 37 assigned component types per side consume reels. Capacities are 5000 / 2000 / 500 by footprint-derived tape class, initially randomized to 20–100%. Low alarms trigger at 3%; exhaustion invokes the native 40-second fault/refill coroutine. Unassigned slots have inventory but no consumption. Alarm onset is stochastic: these capacities and starting ranges do not guarantee warnings within 20 minutes at the observed cycle rate.

Dynamic groups are marked and static subassemblies baked. Pool parts and feeder samples disappear at far LOD. Exposed info, live monitors, clickable doors, cover/path controls, inventory, head state and two machine-camera descriptors.

Views: iso, front, side, top, gantry, board, pickf, pickr. Nozzle presets are fixed relative views; unlike the original, they do not continuously follow the moving head.

The page retains original styling, lane maps, nozzle grids, legend, command rows, timeline and tool bar. Playback and 0.25/0.5/1/2/5 speeds use core time, initially 1×. Seeking and cyclic restart were removed; each head has its own playhead. Added nozzle-change, reject and feeder-alarm counters.

## Verification evidence

Node v25.2.1; bundled THREE revision 147.

Both syntax commands exited 0:
- node --check <repo>/src/machines/placement.js
- node --check <repo>/src/pages/placement.page.js

An in-memory Node VM harness used the delivered module, real r147 geometries, PCB kit, line.js Board/SMEMA implementation and the unchanged core bake function. Canvas drawing, labels and WebGL were stubbed; its coroutine scheduler mirrored the core at 20 ms steps. This is logic/geometry evidence, not browser rendering evidence.

Final harness stdout (exit 0):

    flow 600s {"out":8,"placed":2312,"cts":[143.3,140.3,146.52,146.56,145.5,146.68,146.68,147.46],"rejects":9}
    empty reel recovered 1 4960 / 5000
    split job 179 110 partial accepted 12 complete boards with injected defects 10
    starvation clock freeze, independent blocked lane recovery, negative assertion probe: OK
    visible machine objects (not GPU draw calls) 392

Assertions checked growing output, merged partial-template vertex totals, complete job coverage, final defect provenance, empty-reel recovery, starvation clock freezing, both blocked work buffers, one lane recovering independently, and far-LOD visibility. A deliberately incorrect stage assertion was required to throw. An earlier split assertion incorrectly expected the full board's 27 materials on a partial board; it failed with 10 and was replaced by the source-geometry vertex-total assertion.

Build: exercised build.py's inline function and CLI main in memory. Intercepted the dist write/mkdir and corresponding output stat, because dist/placement.html is outside the assigned write list. An initial capture failed at output stat because no dist file was written; the corrected run exited 0. Re-inlined final source after the last inventory change. No dist file was written.

Final in-memory HTML: 785822 bytes; all local scripts/styles embedded.

## Remaining coordinator verification / limitations

- Chrome was not started, per brief. Console errors, appearance, light/dark screenshots and GPU draw-call budget remain unverified. The 392 visible machine objects exclude neighbouring stubs and boards and are NOT a draw-call measurement.
- Original screenshot was absent; original reference geometry was retained.
- Nominal metadata is 1280 × 2332 × 1444 mm; original skin, handles and signal tower extend beyond the body envelope.
- Rejects disappear at the dump event; loose rejected components do not accumulate in the bin.
- Coordinator should run the normal build and 600-second browser check across all eight views in dark/light themes.
- No core/line changes requested.

## Final source SHA256

- <repo>/src/machines/placement.js: f589b38aa13816c4ec9c4d60285f1afcb0ced6153c8ee897df9b5513b5ab937f
- <repo>/src/pages/placement.html: 24abe226548546a6c8b2ee446c5a133577b2bc8f10bb159018d1aaa96fb65cec
- <repo>/src/pages/placement.page.js: beecd6b7e80af23448642166cf80c1d67dda7583e907a97a78ffa1c25350a68c
- <repo>/src/pages/placement.css: e09dce1ae026ca819a88f4399ce7dc8aa9e74864a7f5149d199ea95b212f6b8d


## Fix round 1

Replaced per-nozzle ANC visits with one visit per trip when needed, lasting 0.6 + 0.05 × changed-nozzle count seconds. Assignment first matches each installed nozzle class to a compatible part, then assigns unmatched parts to remaining nozzles. This achieves the minimum class-change count per trip. X ordering and bounded same-class assignment swaps further reduce travel without adding changes. ANC segments list every changed nozzle/class; events update all classes and increment the HUD counter per nozzle.

Assignments are private to each head/board. The shared job remains unchanged; pool lookup and board-map completion tracking use the original job reference. The HUD highlights all nozzles participating in an ANC operation.

Also corrected accumulated simulation-step rounding: unused time from a finished segment now carries into the next segment, while starvation/fault waits discard it. Previously each short segment rounded upward independently, adding about 10 seconds beyond its scheduled duration.

Nozzle F/R view functions now fly to the current head and return the core follow callback. Camera and target approach head-relative positions with 1-exp(-8*rdt), including the machine and translated line origin. Front/rear offsets are mirrored. Other presets remain fixed. Core camera-grab cancellation and snapCam behavior are unchanged.

### Measured schedule and verification

Node v25.2.1 / THREE r147. Nominal schedule measurements disable random vision rejects (Math.random fixed at 0.5), retain fiducials, scans, placements, all ANC changes and original motion durations. Both initial and subsequent boards were checked:

| Head | Cold schedule | Subsequent schedule | Nozzles changed / board | ANC visits / board |
| --- | ---: | ---: | ---: | ---: |
| F | 102.566824 s | 102.566824 s | 48 | 7 |
| R | 102.575319 s | 102.575319 s | 48 | 7 |

Both nominal schedules meet the ≤105-second target. First-board measured SMEMA cycle times in the deterministic fixture were 101.78 / 101.80 seconds (pre-picks overlap arrival). Reject recovery, reel faults or downstream blocking can legitimately exceed the nominal target; it is not a hard cycle cap. One stochastic cold schedule measured 105.664306 seconds with rejects.

Final logic/geometry harness exited 0. It used actual module/PCB-kit/line code and native core bake, with canvas/WebGL stubs and a core-equivalent 20 ms scheduler:
- Continuous 600-second stochastic run: 10 boards out, 3274 placement events, 14 rejects.
- Empty reel fault recovered and refilled.
- Split 179/110 job: 18 partial boards accepted, 16 fully assembled boards finished.
- Starved clocks freeze; one blocked lane resumes independently; far LOD hides pool/sample meshes.
- Every trip has unique nozzle assignments and exactly the mathematically minimal class-change count.
- Exactly one ANC segment when changes are needed; duration equals 0.6 + 0.05*n.
- Both cold/warm schedules place all 289 distinct parts; shared job indices are unchanged.
- Both follow callbacks tested against expected interpolated coordinates and constant camera-target offset on a translated line/machine; fixed overview returns no callback.
- Known-failure stage assertion still throws as expected.

Commands run successfully (exit 0):
- node --check <repo>/src/machines/placement.js
- node --check <repo>/src/pages/placement.page.js
- python3 <repo>/build.py placement

This round ran the requested normal build and produced <repo>/dist/placement.html. Verified embedded dependencies with no missing-script placeholders. Browser rendering and visual follow-camera checks remain for the coordinator, as instructed. Earlier report measurements and hashes above describe the previous revision.

Updated source SHA256:

- <repo>/src/machines/placement.js: db0a14cc0b4deb57e7f535aa4b52f792d16ee999a97a6e4127c740e0921604d1
- <repo>/src/pages/placement.page.js: a7add033e456978c8e3752ebfd85e484435019382d7ab8a2d4ac1d562bece9a8

## Round 2

Codex had the resident-nozzle program, the mechanical detail and the HMI in the module when the session hit the usage limit. The report section and the iso draw-call budget were still open (headless Chrome measured 521 calls against a 280 ceiling). This section closes both. Only the four owned page files were edited; the last code change is the distance gate in `placement.js`.

### Nozzle strategy

The program is planned once per job. Each head keeps a resident set of 8 small, 6 medium and 2 large nozzles (16). Parts are grouped into trips that use only that set. Packages wider than 12 mm are not in those trips: they run in two dedicated trips at the end, on 8 fixed sockets (0, 2, 4, 6, 9, 11, 13, 15). One ANC visit swaps those sockets to the special nozzle (0.6 + 0.05×8 = 1.0 s). A second visit puts the resident set back before the board leaves.

The set is restored at the end of every board. Leaving the specials mounted would spend the same two visits at the start of the next board and would slow the chip trips. Both heads therefore have the same cold and warm schedule.

Nominal schedules use `Math.random` fixed at 0.5, so vision rejects do not fire. All 289 placements are covered once, with no duplicate nozzle in a trip.

| Head | Trips | ANC visits | Nozzles changed | Nominal cycle |
| --- | ---: | ---: | ---: | ---: |
| F | 21 | 2 | 16 | 96.73 s |
| R | 21 | 2 | 16 | 96.90 s |

Fix 1 was 102.57 / 102.58 s with 48 changes and 7 ANC visits. Round 2 is under the 100 s / 2 visit target.

### What was added

1. Feeders: sprocket pockets advance one pitch per pick, reel spokes rotate by the consumed arc, cover tape peels to a take-up, empty tape runs into a chute and cutter under each bank.
2. Head: each nozzle has its own Z stroke and θ, a vacuum colour on the tip, and an instanced body between pick and place.
3. Lanes: backup table and support pins rise with the clamp, edge clamps close, the stopper pin lifts, three presence lamps per lane.
4. Vision: the line camera flashes during SCAN, the head camera ring lights during fiducial capture.
5. Exterior: signal tower follows RUN / wait / DOWN, front and rear E-stops, levelling feet, SMEMA plugs, nameplate, pinch-point sticker, cable glands. No brand names.
6. HMI canvas and the side panel: placements per hour per head, nozzle class per socket, feeder alarm lines, reject ppm.

### Draw calls

Repeated tape, reel, vacuum, theta and carried-part geometry is instanced. Static covers and feeder banks are baked. Individual part meshes, nozzle bodies and the carried-part instances are shown only inside 3.8 m, or when the covers are not solid. The iso camera sits at about 5.1 m, so that detail is off there and on in gantry, board and nozzle views.

| Moment | render.calls at iso |
| --- | ---: |
| Fix 1 reference in the brief | 224 |
| Round 2 before the distance gate, after 600 s | 521 |
| After the gate, nominal load | 68 |
| After the gate, 600 s, boards in process | 113 |

Ceiling is 280 (224 + 25 %). Page errors: 0.

### Flow check

Headless Chrome, `dist/placement.html`, fast-forward 600 s, dark then light, views iso, gantry, board, pickf, pickr. No page errors and no console errors.

- Boards in 14, boards out 11, state still RUN.
- Placements 3466, nozzle changes 184, vision rejects 13, feeder alarms 0.
- Average cycle 99.46 s. One recorded board was 102.46 s because a reject adds a retry; the nominal schedule stays at 96.7–96.9 s.
- Screenshots: `<repo>/shots/placement_r2/`.

The empty-reel fault, the starvation freeze and the blocked-lane recovery were already passing on this process code before the visibility change. That change does not touch the schedule or the SMEMA loops.

### Known limits

- A rejected part disappears at the dump. The bin does not fill up.
- Beyond 3.8 m the nozzle bodies and the loose component meshes are hidden. Open the covers, or use gantry / board / nozzle, to see them.
- No core or line change.

### SHA256

- `<repo>/src/machines/placement.js`: f08e8fc492983880f4f7963f517bfd3c8f421bf1eb1c9e5b25f1bfc1dfa6ac5f
- `<repo>/src/pages/placement.page.js`: 5cd1c653aa7d8547f8407f6e002f21367bb3f9d771369038018f439221478290
- `<repo>/src/pages/placement.html`: 66bf6858ebc96de1b867abccea32d04db03378add241b979278f1685960e1b82
- `<repo>/src/pages/placement.css`: de1caea503d3f92bcc5951737ea21ec8d4d7f6378d224aaad82666a729bab665

GATA PLACEMENT R2
