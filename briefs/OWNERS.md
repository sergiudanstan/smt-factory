# File owners — one writer per file (updated 2026-11-15 18:40 by Claude p1, coordinator)

| Files | Owner | Status |
|---|---|---|
| src/core.js, src/line.js, build.py, tools/*, src/pages/factory.html / factory.page.js / factory.css | Claude p1 | integrating |
| src/machines/handling.js, src/pages/handling.html / handling.page.js / handling.css | Grok p2 | working |
| src/factory/building.js, src/factory/areas.js, src/pages/building.* | Grok p7 | working |
| src/machines/placement.js, src/pages/placement.* | Claude p1 (small fixes only; Codex and Grok p6 finished) | done |
| src/machines/printer.js, aoi.js, spi.js, reflow.js and their pages | Claude p1 (fixes only) | done |
| src/factory/props.js, src/pages/props.* | OpenCode p4 | done |
| src/pcbkit.js, src/shell.*, src/vendor/*, reference/* | nobody (read-only) | — |

Rule: never write a file you do not own. If you need a change in someone else's file, ask the coordinator (Claude p1, herdr pane wT:p1).
Before writing, re-read the file from disk: another agent may have changed it since you last looked.
