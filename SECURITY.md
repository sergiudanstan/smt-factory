# Security Policy

This is a set of static, browser-only 3D simulations: a landing page and self-contained pages in `dist/`, with no backend, no
accounts, no cookies and no data sent anywhere. three.js r147 is vendored in `src/vendor/` and inlined into each page, so the
pages load no code from any other origin. The only thing stored locally is the theme choice (`localStorage`).

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | ✅ Current |

Single maintainer; only the latest release receives fixes.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.** Report it privately:
**[Report a vulnerability](https://github.com/sergiudanstan/smt-factory/security/advisories/new)**
(Security → Advisories → Report a vulnerability).

| Stage | Target |
|---|---|
| Acknowledgement | within 3 business days |
| Triage | within 10 business days |
| Fix, or a documented decision not to fix | within 90 days |

These are best-effort targets from a single unpaid maintainer, not a contractual SLA.
There is no bug bounty; credit is offered in the advisory and changelog.

## Scope

In scope: script injection through the pages, any page that loads code or data from another origin, a committed `dist/` that does not match what `build.py` produces from `src/`, and anything in this repository's workflows that could publish a release not built from `main`.

Out of scope: vulnerabilities in three.js r147 itself (report upstream; it is vendored and not updated by Dependabot), and the accuracy of the simulation or its agreement with any real machine: that is a correctness bug, file it as a normal issue. `tools/` (screenshots, thumbnails, frame-rate measurement) runs on a developer machine only and is not part of the published pages.

## Supply chain

CI rebuilds `dist/` and checks it matches the commit, loads every page in headless Chrome and fails on any page or console error, runs `pip-audit` on the hash-pinned test dependency (playwright),
`pip-audit` on the hash-pinned CI toolchain, CodeQL, and `zizmor` on the workflows.
Actions are pinned to full commit SHAs and kept current by Dependabot. Releases attach a
source archive with Sigstore build provenance:

```
gh attestation verify smt-factory-v0.1.0.tar.gz --repo sergiudanstan/smt-factory
```
