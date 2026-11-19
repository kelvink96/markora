# In-App Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desktop Markora checks for updates at launch and on demand, and installs a verified update from a Settings "Updates" card.

**Architecture:** A `src/platform/updates/` adapter wraps `@tauri-apps/plugin-updater` and `@tauri-apps/plugin-process` (web is a no-op). A Zustand store `src/features/updates/update-store.ts` owns the status machine. The release script `scripts/publish-signed-release.ps1` signs the final Authenticode-signed MSI with the updater key and publishes `docs/latest.json` on GitHub Pages, which the app reads.

**Tech Stack:** Tauri v2 (`tauri-plugin-updater`, `tauri-plugin-process`), React 19, Zustand, Vitest, PowerShell + Node for the release script.

**Spec:** `docs/superpowers/specs/2026-11-19-in-app-updates-design.md`

## Global Constraints

- Plugin calls live only inside `src/platform/updates/`; components never import `@tauri-apps/*` (CLAUDE.md architecture rule).
- Desktop only. `detectPlatform() === "web"` shows no Updates UI, no badge, and runs no check.
- Never download or install without a user click. Install mode `passive`.
- Updater endpoint: `https://kelvink96.github.io/markora/latest.json`. Public key (verbatim, in `tauri.conf.json` `plugins.updater.pubkey`): `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDRGRTI0RUNFNjJBNDAzNDQKUldSRUE2Uml6azdpVDlxQlpkaEs4RjFSUm15WmlJeUttZUZsUElIaVNubzhBOFVyZVc3SGw5Q2gK`
- `createUpdaterArtifacts` stays off: the updater signature must be made from the final Authenticode-signed MSI, not at build time.
- `tauri.conf.json`, `package.json` and `src-tauri/Cargo.toml` versions stay aligned (1.4.0 now; the first updater release is 1.5.0).
- Setting default: `updates.checkAutomatically = true`.
- Tests before logic (CLAUDE.md). Run one heavy command per message, scoped (`npx vitest run <file>`), never concurrently.
- Work on branch `feat/in-app-updates`; commit per task.

## Review Focus

- Launch check with no network or a 404 manifest: no toast, no error UI; store ends `idle`/`up-to-date`. (Task 3, 4)
- Manifest version equal to or older than the installed one: "up to date", never "available". (Task 2)
- Signature verification failure or download error mid-install: `error` state with retry, app keeps running the old version. (Task 3)
- Clicking "Check for updates" while a check or download is already running does nothing extra. (Task 3)
- Settings saved by an older Markora (no `updates` group) load with `checkAutomatically: true`. (Task 4)
- Restart is blocked while any tab has unsaved changes. (Task 6)

---

### Task 1: Desktop plumbing (plugins, permissions, config, CSP)

**Files:**
- Modify: `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`, `src-tauri/tauri.conf.json`, `package.json`
- Modify: `src-tauri/Cargo.toml` `version` to `1.4.0`

**Interfaces:**
- Produces: the `updater` and `process` Tauri plugins registered and permitted; `@tauri-apps/plugin-updater` and `@tauri-apps/plugin-process` installed.

- [ ] **Step 1:** `git checkout -b feat/in-app-updates`. Add `tauri-plugin-updater = "2"` and `tauri-plugin-process = "2"` to `Cargo.toml`; set the package `version` to `1.4.0`. `npm install @tauri-apps/plugin-updater @tauri-apps/plugin-process`.
- [ ] **Step 2:** In `lib.rs` register `tauri_plugin_updater::Builder::new().build()` and `tauri_plugin_process::init()` next to the existing `.plugin(...)` calls.
- [ ] **Step 3:** Add `"updater:default"` and `"process:allow-restart"` to the `permissions` array in `capabilities/default.json`.
- [ ] **Step 4:** In `tauri.conf.json` add `"plugins": { "updater": { "pubkey": <key above>, "endpoints": ["https://kelvink96.github.io/markora/latest.json"], "windows": { "installMode": "passive" } } }`, and append `https://kelvink96.github.io` to the CSP `connect-src`.
- [ ] **Step 5:** Run `cd src-tauri && cargo check`. Expected: compiles with no errors.
- [ ] **Step 6:** Commit `feat(updates): register updater and process plugins`.

### Task 2: Update adapter

**Files:**
- Create: `src/platform/updates/types.ts`, `desktop.ts`, `web.ts`, `index.ts`
- Test: `src/platform/updates/desktop.test.ts`, `src/platform/updates/web.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export interface AvailableUpdate { version: string; notes: string; publishedAt: string | null }
  export interface DownloadProgress { downloaded: number; total: number | null }
  export interface UpdateAdapter {
    checkForUpdate(): Promise<AvailableUpdate | null>;
    /** Installs the update returned by the last checkForUpdate(); rejects if there is none. */
    downloadAndInstall(onProgress: (progress: DownloadProgress) => void): Promise<void>;
    relaunch(): Promise<void>;
  }
  ```
  `getUpdateAdapter(): UpdateAdapter` in `index.ts`, selected by `detectPlatform()` exactly like `getFileAdapter()`. `desktopUpdateAdapter` and `webUpdateAdapter` are named exports.

- [ ] **Step 1:** Write failing tests (mock `@tauri-apps/plugin-updater` and `@tauri-apps/plugin-process` with `vi.mock`):
  - `desktop.test.ts`: `checkForUpdate` returns `null` when `check()` resolves `null`; returns `{version:"1.5.0", notes:"Fixes", publishedAt:"2026-12-01T00:00:00Z"}` when `check()` resolves an update with `version`, `body`, `date`; `downloadAndInstall` forwards `Started{contentLength:100}` then `Progress{chunkLength:40}` x2 as `{downloaded:40,total:100}`, `{downloaded:80,total:100}`; `downloadAndInstall` before any check rejects with "No update to install"; `relaunch` calls the plugin's `relaunch`.
  - `web.test.ts`: `checkForUpdate` resolves `null`; `downloadAndInstall` rejects; `relaunch` rejects.
- [ ] **Step 2:** Run `npx vitest run src/platform/updates`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement the four files. Desktop keeps the `Update` handle from `check()` in a module-level variable; `notes` is `update.body ?? ""`; `total` is `contentLength ?? null`.
- [ ] **Step 4:** Run `npx vitest run src/platform/updates`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(updates): add platform update adapter`.

### Task 3: Update store

**Files:**
- Create: `src/features/updates/update-store.ts`
- Test: `src/features/updates/update-store.test.ts`

**Interfaces:**
- Consumes: `getUpdateAdapter()`, `AvailableUpdate`, `DownloadProgress` from Task 2.
- Produces:
  ```ts
  export type UpdateStatus = "idle" | "checking" | "up-to-date" | "available" | "downloading" | "ready" | "error";
  interface UpdateState {
    status: UpdateStatus;
    update: AvailableUpdate | null;
    progress: DownloadProgress | null;
    error: string | null;
    check(options?: { silent?: boolean }): Promise<void>;
    install(): Promise<void>;
    restart(): Promise<void>;
  }
  export const useUpdateStore: UseBoundStore<StoreApi<UpdateState>>;
  ```

- [ ] **Step 1:** Write failing tests (mock `../../platform/updates`, reset store state in `beforeEach`):
  - `check()` → `checking` then `up-to-date` when adapter returns `null`; `available` with `update` set otherwise.
  - Silent check whose adapter rejects ends `idle` with `error: null`; non-silent check that rejects ends `error` with the message.
  - `check()` is a no-op while `status` is `checking` or `downloading`.
  - `install()` goes `downloading`, records `progress` from the adapter callback, ends `ready`; a rejection ends `error` and keeps `update` so retry works.
  - `install()` is a no-op unless `status` is `available` (or `error` with an `update`).
  - `restart()` calls `adapter.relaunch()` only when `status` is `ready`.
- [ ] **Step 2:** Run `npx vitest run src/features/updates/update-store.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the store as specified.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit `feat(updates): add update status store`.

### Task 4: Setting and launch check

**Files:**
- Modify: `src/features/settings/settings-schema.ts` (new `UpdateSettings { checkAutomatically: boolean }`, `updates` group on `MarkoraSettings`, default `true`), plus whatever merges loaded settings with defaults in `settings-api.ts` / `settings-store.ts` if it is not already deep.
- Create: `src/features/updates/use-update-check.ts`
- Modify: `src/App.tsx` (call the hook)
- Test: `src/features/settings/settings-schema.test.ts`, `src/features/settings/settings-api.test.ts`, `src/features/updates/use-update-check.test.tsx`

**Interfaces:**
- Consumes: `useUpdateStore` (Task 3), the settings store, `detectPlatform()`.
- Produces: `useUpdateCheckOnLaunch(): void`, which calls `check({ silent: true })` once per app run when on desktop, settings are hydrated, and `settings.updates.checkAutomatically` is true. Follow the hydration guard pattern already used in `App.tsx` for the Tour version (defaults must not trigger a check before real settings load).

- [ ] **Step 1:** Write failing tests: defaults include `updates.checkAutomatically === true`; settings JSON without an `updates` key loads with it `true`; hook calls `check({silent:true})` once on desktop with the setting on, never when the setting is off, never on web, never before hydration, and does not re-run on re-render.
- [ ] **Step 2:** Run `npx vitest run src/features/settings src/features/updates/use-update-check.test.tsx` (one command, scoped). Expected: FAIL.
- [ ] **Step 3:** Implement schema, merge fix if needed, hook, and the single call in `App.tsx`.
- [ ] **Step 4:** Run the same command, then `npx vitest run src/App.test.tsx`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(updates): check for updates at launch`.

### Task 5: Updates card in Settings

**Files:**
- Create: `src/components/settings-page/updates-card.tsx`
- Modify: `src/components/settings-page/settings-page.tsx` (render the card above `SettingsFooter`, desktop only)
- Test: `src/components/settings-page/updates-card.test.tsx`

**Interfaces:**
- Consumes: `useUpdateStore`, settings store (`updates.checkAutomatically`), a `hasUnsavedChanges: boolean` prop and `version: string` prop (from the existing `version` passed to `SettingsPage`).
- Produces: `UpdatesCard({ version, hasUnsavedChanges }: { version: string; hasUnsavedChanges: boolean })`.

- [ ] **Step 1:** Write failing tests, one per state, using the store seeded directly:
  - `idle`: shows `Version 1.4.0` and a "Check for updates" button that calls `check()`.
  - `checking`: button disabled, label "Checking…".
  - `up-to-date`: text "You're up to date".
  - `available` (update `1.5.0`, notes `"Fixes"`): shows `1.5.0`, the notes, and an "Install update" button that calls `install()`.
  - `downloading` with `{downloaded:40,total:100}`: shows a progressbar with `aria-valuenow=40`.
  - `ready`: "Restart to finish" button calls `restart()`; with `hasUnsavedChanges` true it is disabled and the text "Save your changes before restarting." is shown. (Plan call: block rather than prompt, which keeps the no-lost-work rule without a save-all flow.)
  - `error`: shows the message and a "Try again" button.
  - The "Check automatically" switch reflects and updates `settings.updates.checkAutomatically`.
- [ ] **Step 2:** Run `npx vitest run src/components/settings-page/updates-card.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement `UpdatesCard` with existing `components/ui` primitives. In `settings-page.tsx` render it only when `detectPlatform() === "desktop"`, deriving `hasUnsavedChanges` from the document store (add a `hasUnsavedChanges` selector in `src/store/document/` with its own test if one does not exist).
- [ ] **Step 4:** Run `npx vitest run src/components/settings-page`. Expected: PASS (footer and page tests still pass).
- [ ] **Step 5:** Commit `feat(updates): add Updates card to settings`.

### Task 6: Badge and palette command

**Files:**
- Modify: `src/components/editor-page/top-bar/` (the settings button), `src/features/commands/palette-commands.ts`, `src/features/commands/menu-layout.ts`, `src/App.tsx` (wire handler)
- Test: `top-bar.test.tsx`, `palette-commands.test.ts`, `menu-layout.test.ts`

**Interfaces:**
- Consumes: `useUpdateStore`.
- Produces: a dot with `data-testid="update-badge"` and accessible label "Update available" on the settings button while `status` is `available`, `downloading` or `ready`; `PaletteHandlers.onCheckForUpdates: () => void`; `PaletteContext.updatesSupported: boolean`; command `{ id: "check-for-updates", label: "Check for updates", group: "App", enabled: context.updatesSupported }` (also listed under Help in `menu-layout.ts`).

- [ ] **Step 1:** Write failing tests: badge renders only in the three statuses and not on web; the palette includes "Check for updates" when `updatesSupported` and hides it otherwise; `run` calls `onCheckForUpdates`; menu layout includes the id once.
- [ ] **Step 2:** Run `npx vitest run src/components/editor-page/top-bar src/features/commands`. Expected: FAIL.
- [ ] **Step 3:** Implement. In `App.tsx`, `onCheckForUpdates` opens Settings and calls `useUpdateStore.getState().check()`; `updatesSupported` is `!isWeb`.
- [ ] **Step 4:** Run the same command, then `npx vitest run src/App.test.tsx`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(updates): add update badge and palette command`.

### Task 7: Release script and version alignment

**Files:**
- Create: `scripts/build-update-manifest.mjs`, `scripts/build-update-manifest.test.mjs`
- Modify: `scripts/publish-signed-release.ps1`, `.release-it.json`, vitest config `include` if it does not already pick up `scripts/`

**Interfaces:**
- Produces: `export function buildUpdateManifest({ version, notes, pubDate, url, signature }): object` returning `{ version, notes, pub_date: pubDate, platforms: { "windows-x86_64": { signature, url } } }`; CLI `node scripts/build-update-manifest.mjs --version <v> --url <url> --signature-file <path> --notes <text> --out <path>` writing that JSON with `pub_date` set to now (UTC ISO).

- [ ] **Step 1:** Write failing test: `buildUpdateManifest({version:"1.5.0", notes:"Fixes", pubDate:"2026-12-01T00:00:00Z", url:"https://kelvink96.github.io/markora/releases/1.5.0/Markora-MD_1.5.0.msi", signature:"SIG"})` deep-equals the expected object above; a missing `signature` throws.
- [ ] **Step 2:** Run `npx vitest run scripts/build-update-manifest.test.mjs`. Expected: FAIL.
- [ ] **Step 3:** Implement the module and CLI.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Extend `publish-signed-release.ps1`: add optional `[string]$Notes = ""`; after the Authenticode `Valid` check run `npx tauri signer sign $targetPath` (key and password from `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, throw if unset or `$LASTEXITCODE -ne 0`), read `"$targetPath.sig"`, call the manifest CLI to write `docs/latest.json`, and add `docs/latest.json` to the `git add`. In `.release-it.json` add `{ "file": "src-tauri/Cargo.toml", "path": "package.version" }` to the bumper `out` list.
- [ ] **Step 6:** Verify without publishing: in a scratch copy of a signed MSI, run the signing command and manifest CLI by hand; confirm `latest.json` parses and `signature` equals the `.sig` contents. Expected: valid JSON, matching signature.
- [ ] **Step 7:** Commit `feat(updates): publish signed update manifest in release script`.

### Task 8: End-to-end check (manual, no commit)

- [ ] **Step 1:** Build a test `1.4.0` app with a config override pointing the endpoint at `http://127.0.0.1:8080/latest.json`, `dangerousInsecureTransportProtocol: true`, and `http://127.0.0.1:8080` added to CSP `connect-src`: `npm run tauri build -- --config <override.json>`. Install it.
- [ ] **Step 2:** Produce a `1.5.0` MSI, sign it with the new updater key, write a `latest.json` with the Task 7 CLI, and serve both with `npx http-server -p 8080` from a scratch folder.
- [ ] **Step 3:** Launch the installed 1.4.0. Expected: badge appears, Settings > Updates shows 1.5.0 and notes; "Install update" shows progress, then "Restart to finish"; the restart installs and the app reports Version 1.5.0.
- [ ] **Step 4:** Repeat with a tampered MSI (signature mismatch). Expected: "error" state, app stays on 1.4.0.
- [ ] **Step 5:** Stop the server and uninstall the test build. Run `npx tsc --noEmit` and `npx vitest run` in sequential shards (project memory: no file parallelism) before opening the PR; the PR body needs the `## Diagram` and `## Video` sections.
