# Codex — PLACEMENT round 2: realism + detail upgrade (you own the module, no overlap)

Files you own (write ONLY these): src/machines/placement.js, src/pages/placement.page.js, src/pages/placement.html, src/pages/placement.css.
Do NOT edit core.js, line.js, build.py, tools/, or any other machine/page (Claude agents work on printer/aoi/spi/reflow, Grok on
handling/building, OpenCode on src/factory/props.js — all at the same time).
Context: the user asked for every machine to be MORE COMPLEX, MORE PRECISE, MORE REALISTIC, with more details. Your port + fix1 are verified
in Chrome by the coordinator (0 errors, cycle ~103 s, Nozzle F follows the head) — keep all of that working. Contract: briefs/CONTRACT.md.

## 1. Nozzle strategy like a real line (must)
48 nozzle changes in 7 ANC visits per board is not how production runs: a program assigns a fixed nozzle set per head and groups parts
into trips by nozzle class; ANC visits happen only for the few large parts (QFP/BGA/connectors), typically 0–2 visits per board.
- Program optimiser (once per job, not per board): choose a resident nozzle set per head (e.g. 12 × small-chip, 2 × mid, 2 × large/IC),
  partition parts into trips so each trip uses only resident classes, and put the parts needing special nozzles into 1–2 dedicated trips
  at the end with one ANC visit before them (and one back, or keep the set for the next board if that is cheaper — decide and document).
- Report per board: trips, ANC visits, nozzles changed, cycle per head. Target: ≤ 2 ANC visits per board, cycle ≤ 100 s
  (it should go DOWN vs fix1; if it does not, explain why from the schedule numbers).

## 2. Mechanical/process detail (should — pick in this order, stop when the cycle numbers or frame budget suffer)
1. Feeders: tape advances one pitch per pick on the picked feeder (sprocket/pocket index visible on the reel or tape, cover-tape peel to the
   take-up), empty tape exits to a waste chute/cutter under the feeder bank. Reel rotates by the consumed pitch (honest small motion).
2. Head: per-nozzle Z and θ axis motion (θ rotation visible on the nozzle when a part is placed at 90°/180°), vacuum state per nozzle
   (small LED ring or colour on the nozzle tip), component visibly on the nozzle tip between pick and place (instanced, correct size per class).
3. Board handling per lane: support pins / backup table rising, edge clamps closing, board stopper, presence sensors — all animated with the
   lane state you already have (HOLD CLAMPED etc.).
4. Vision: on-the-fly line camera flash (brief emissive pulse) during SCAN, fiducial camera on the head with a ring light pulse at fiducial capture.
5. Exterior: signal tower states consistent with machine state (green RUN / amber STARVED-BLOCKED / red DOWN), E-stops front+rear,
   levelling feet, SMEMA connectors, nameplate + warning stickers (pinch point, moving parts), cable glands. No brand names.
6. HMI/monitor (canvas): placement rate per head, nozzle-set table with class per nozzle, feeder alarms list, reject rate ppm.

## 3. Performance + verification
- Keep render.calls at the iso view within +25 % of now (now ~224). Use InstancedMesh / C.bake for repeated feeder geometry; mark animated
  objects with C.dyn before baking.
- node --check both files; python3 build.py placement; your logic harness (600 s stochastic run, reel fault, starve/block) must still pass.
- The coordinator renders in Chrome afterwards (views iso, gantry, board, pickf, pickr, dark + light).

## 4. Report
Append "Round 2" to reports/codex_placement.md: what was added (list), nozzle strategy + numbers table, draw-call estimate, known issues.
Finish with the line GATA PLACEMENT R2.
