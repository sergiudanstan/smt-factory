# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-11-26

### Removed
- `briefs/`, `reports/` and `reference/`: working notes and earlier versions of the machine pages from how the suite was built. Nothing in `build.py`, `tools/`, CI or `src/` read them; `dist/` is byte-identical before and after.

## [0.1.0] - 2026-11-25

First tagged release of the SMT Factory Suite as published at
https://sergiudanstan.github.io/smt-factory/: standalone 3D simulations of the printer, SPI,
pick-and-place, reflow oven, AOI and board-handling machines, a plant-hall page, and a factory page
that runs two complete SMT lines inside the hall.

### Added
- `README.md`, `VERSION` (the version source), `SECURITY.md`, `CONTRIBUTING.md` and this changelog.
- CI that rebuilds `dist/` with `build.py` and fails if it differs from the commit, loads every built
  page in headless Chrome through `tools/check.py`, includes a perturbation check, and audits
  dependencies and workflows; Python lint with `ruff` limited to syntax errors and undefined names.
- CodeQL, OpenSSF Scorecard and a tag-triggered release workflow with build provenance; Dependabot
  for actions and the pinned test dependency.

### Changed
- `tools/check.py` gained a `--timeout` option (default unchanged at 30 s) because `factory.html`
  can take longer than that to load on software WebGL.

[Unreleased]: https://github.com/sergiudanstan/smt-factory/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/sergiudanstan/smt-factory/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/sergiudanstan/smt-factory/releases/tag/v0.1.0
