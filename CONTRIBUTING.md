# Contributing

Contributions are welcome. This is a single-maintainer project, so please open an issue
before starting anything substantial.

**Security problems do not belong in issues.** Follow [SECURITY.md](SECURITY.md).

## Branches, pull requests and releases

- `main` is the only long-lived branch and is protected: changes land through a pull
  request with the required checks green, commits on `main` are signed, and force-pushes
  are refused. Pull requests are squash-merged; GitHub deletes the branch on merge.
- Branch names: `<type>/<topic>` (`feat/`, `fix/`, `docs/`, `chore/`, `release/`);
  agents use `agent/<name>/<topic>`.
- A release is a pull request that bumps the `VERSION` file and moves
  `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md) to a dated version. After it merges, a
  signed `vX.Y.Z` tag on that commit triggers `release.yml`, which refuses to run if the
  tag, the `VERSION` file and the changelog disagree. Tags are never moved or deleted.

## File ownership

This repository was built with one writer per file; [briefs/OWNERS.md](briefs/OWNERS.md) lists who owns what, and `src/vendor/`, `src/shell.*`, `src/pcbkit.js` and `reference/` are read-only. Keep to it: do not restructure, and if a change needs another module's file, say so in the pull request.

## Running it locally

```bash
pip install -r .github/requirements-test.txt     # playwright, for tools/check.py
python3 build.py                                  # src/ -> dist/ (commit the result)
python3 -I tools/check.py dist/printer.html --ff 120
```

Open `dist/<page>.html` or `src/pages/<page>.html` directly in a browser. `tools/check.py` needs Google Chrome installed. CI fails if `dist/` is stale, so always rebuild before committing a change under `src/`.
