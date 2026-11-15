# Handover from Claude p5 → coordinator p1 (2026-11-15)

## What p5 did
- Re-ran your phase-1 workflow in lean form (script: <local-temp-file>
  run wf_33709cfd-04e): printer, aoi, spi, reflow = build → ONE combined tech+realism review → fix. All 12 agents done.
  Full per-agent reports: <local-session-log>
- handling + building were taken OUT of the workflow and given to Grok p2 (briefs/grok_handling.md, briefs/grok_building.md).
- Codex p3: fix1 (grouped ANC, follow views) done and verified in Chrome; round 2 brief briefs/codex_placement_upgrade2.md started,
  Codex hit its usage limit mid-way (resets 22:08). placement.js parses and runs (resident nozzle set, ~99.8 s), but R2 is unfinished
  and the report section "Round 2" was not written. (You say Grok p6 now has placement round 2 — make sure it starts from the current file.)

## Verified by p5 in headless Chrome (check.py --ff 600/900, screenshots viewed: shots/coord/)
| page | errors | cycle | render.calls |
|---|---|---|---|
| printer | 0 | 15.2 s, 237 b/h | 306 |
| spi | 0 | 15.5 s, 35 FOV | — (~337) |
| reflow | 0 | transit 8.0 min, peak 244.7 °C, TAL 64 s | 360 |
| aoi | 0 | 18.5 s both lanes | 411 |
| placement | 0 | 99.8 s | **521 — over the +25 % budget (was 224)**, Codex R2 partial |
| handling (Grok) | 0 | 99 in / 85 stored in 900 s, all states sane | 477 |
Grok did not write reports/grok_handling.md (printed GATA HANDLING only).

## Known issues / open items per module (from fix reports)
- printer: core request — factory view handler should call m.setHood(1) when a view has `hood`, m.setSten(!!v.sten), C.setXray(false)
  otherwise (stand-alone vmap does this, factory does not). Paste/paper consumption ×16 demo factor (pasteDemo:1 for real).
  SPI bias / requestClean paths not exercised in the fix runs; clean + nest views not visually checked; 1280 px layout not screenshotted.
- aoi: daily calibration (calN) did not trigger in runs, unchecked after changes; NG boards held 1.6 s after scan; light top/review not viewed.
- spi: light theme not rechecked after fix; board/top views not viewed by fixer.
- reflow: "full-line pass" not run by its fixer; standalone only.
- placement: draw calls 521; R2 items (feeder tape advance, per-nozzle θ/Z, lane clamps, camera flash, HMI nozzle table) not confirmed.
- None of the modules has been run inside dist/factory.html yet.

## Promises made to the user
- That the coordinator verifies every module in Chrome and then assembles the factory (dist/factory.html) and checks it in Chrome.
- That the user should not type "continue" in p1 while p5 was active (now moot: p5 stops).

p5 stops here and will not edit SMT_Factory further.
