# release-it Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add release-it so `npm run release` bumps versions in `package.json` and `src-tauri/tauri.conf.json`, commits, and pushes a `v*` tag to trigger the existing CI build.

**Architecture:** Install `release-it` and `@release-it/bumper` as dev dependencies. A `.release-it.json` config file drives the bump, commit, and tag. The bumper plugin ensures `src-tauri/tauri.conf.json` version stays in sync with `package.json`. No changelog or GitHub Release is created — CI handles the MSIX build when the tag is pushed.

**Tech Stack:** release-it, @release-it/bumper, npm

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json` (devDependencies + script)
- Modify: `package-lock.json` (auto-updated)

- [ ] **Step 1: Install release-it and bumper plugin**

```bash
npm install --save-dev release-it @release-it/bumper
```

Expected output: both packages added under `devDependencies` in `package.json`, `package-lock.json` updated.

- [ ] **Step 2: Verify packages were added**

Open `package.json` and confirm the `devDependencies` section contains entries for `release-it` and `@release-it/bumper`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install release-it and bumper plugin"
```

---

### Task 2: Create release-it config

**Files:**
- Create: `.release-it.json`

- [ ] **Step 1: Create `.release-it.json`**

Create `.release-it.json` at the repo root with this exact content:

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

- [ ] **Step 2: Commit**

```bash
git add .release-it.json
git commit -m "chore: add release-it config"
```

---

### Task 3: Add release script to package.json

**Files:**
- Modify: `package.json` (scripts)

- [ ] **Step 1: Add the release script**

In `package.json`, add `"release": "release-it"` to the `"scripts"` section. The scripts block should look like:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "tauri": "tauri",
  "release": "release-it"
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add release npm script"
```

---

### Task 4: Verify with dry run

**Files:** none

- [ ] **Step 1: Run dry run to verify config**

```bash
npm run release -- --dry-run
```

When prompted for bump type, choose `patch`.

Expected: release-it prints what it *would* do — bumping `package.json` version, bumping `src-tauri/tauri.conf.json` version, creating a commit and tag — without actually writing any files or pushing anything.

Confirm the output mentions both `package.json` and `src-tauri/tauri.conf.json` version updates.

- [ ] **Step 2: Confirm no files were changed**

```bash
git status
```

Expected: `nothing to commit, working tree clean` — the dry run made no actual changes.
