# release-it Integration — Design Spec

**Date:** 2026-03-28
**Status:** Approved

## Goal

Automate version bumping and tag pushing for Markora releases. Running one command should increment the version, keep all version files in sync, commit, and push a `v*` tag that triggers the existing CI release workflow.

## Scope

- Version bump: `package.json` and `src-tauri/tauri.conf.json`
- Git commit + tag push
- No changelog generation
- No GitHub Release creation (CI handles the MSIX build)
- No npm publish (`private: true`)

## Dependencies

```
release-it            (devDependency)
@release-it/bumper    (devDependency)
```

## Configuration

`.release-it.json` at the repo root:

```json
{
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}"
  },
  "npm": {
    "publish": false
  },
  "plugins": {
    "@release-it/bumper": {
      "out": [
        { "file": "src-tauri/tauri.conf.json", "path": "version" }
      ]
    }
  }
}
```

## npm Script

Add to `package.json` scripts:

```json
"release": "release-it"
```

## Release Workflow

1. Run `npm run release`
2. release-it prompts for bump type (patch / minor / major)
3. Bumps version in `package.json` (built-in) and `src-tauri/tauri.conf.json` (via bumper plugin)
4. Commits with message `chore: release vX.Y.Z`
5. Creates and pushes tag `vX.Y.Z`
6. Existing GitHub Actions CI picks up the `v*` tag and builds + signs the MSIX

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `release-it` + `@release-it/bumper` to devDependencies; add `"release"` script |
| `.release-it.json` | New file — release-it config |
| `package-lock.json` | Updated by npm install |
