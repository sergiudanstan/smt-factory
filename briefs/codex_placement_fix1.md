# Codex — PLACEMENT fix round 1 (coordinator review of your port)

Files you own: src/machines/placement.js, src/pages/placement.page.js (+ placement.html/css if needed). Do not touch core.js/line.js.
Verification: the coordinator renders in Chrome (your sandbox cannot). Run `node --check` on your files and `python3 build.py placement`.

## 1. Cycle regression 99 s -> 146 s (must)
`buildSchedule()` travels to the ANC and does one 0.6 s change **per nozzle, inside the part loop** (`for(const p of parts){... move to ANC; add(.6,'anc') ...}`).
Real heads do this once per trip: one travel to the ANC, then all nozzles that need a different class are swapped in the same visit
(the 8 nozzles of a head change together in ~0.6–1.0 s, not 8 × 0.6 s plus travel).
Fix:
- Before the loop, assign parts to nozzles so classes are reused: within a trip, sort/assign parts so nozzle k keeps its current class whenever
  a part of that class exists (minimise changes). Only then compute the set of nozzles whose class differs.
- If the set is non-empty: ONE `move` to the ANC, ONE `add(0.6 + 0.05*n, 'anc', ...)` segment listing all changed nozzles
  (cmd e.g. `ANC N2,N5,N7 -> 0402/QFP`), update `classes[]` for all of them, count nozzle changes per nozzle.
- Target: cycle back to ≤ 105 s for the demo board at 1×. Report the measured cycle in your report (from the schedule total, both heads).

## 2. Nozzle F/R views must follow the head (must)
core.js now supports this: a view **function** may return a per-frame callback `follow(rdt)`; `setView` stores it and calls it every frame
until the user grabs the camera. Also `C.snapCam()` finishes a fly-to instantly (for screenshots).
Make the `pickf` / `pickr` (nozzle) views functions that fly to the current head pose and then return a follow callback that keeps the
camera offset constant relative to the moving head (lerp camera position + controls target toward head-relative pose, e.g. 1-exp(-8*rdt)).
Keep the other views fixed.

## 3. Report
Append a section "Fix round 1" to reports/codex_placement.md: what changed, measured cycle, nozzle changes per board.
Finish with the line GATA PLACEMENT FIX1.
