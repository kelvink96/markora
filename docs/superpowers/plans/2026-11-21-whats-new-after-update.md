# What's new after an update: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After an in-app update relaunches, show a once-only "Updated to x.y.z" toast whose action opens a dialog with the release notes.

**Architecture:** `restart()` saves a `{version, notes, publishedAt}` record to localStorage just before installing. A launch hook compares it with the running version (new `UpdateAdapter.getCurrentVersion()`), shows a sonner toast, and clears the record. The toast action opens a shadcn dialog that renders the notes with the existing `ReleaseNotes`.

**Tech Stack:** React, Zustand, sonner, shadcn Dialog, Tauri v2 (`@tauri-apps/api/app`), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-21-whats-new-after-update-design.md` (mockup: `.lavish/whats-new-mockup.html`, local only).

## Global Constraints

- Desktop only; the web adapter's `getCurrentVersion()` returns `null` and the hook then does nothing.
- No `MarkoraSettings` or Rust change.
- Storage key: `markora:pending-whats-new`. Toast title `Updated to {version}`, description `Markora is up to date.`, action label `What's new`, `duration: Infinity`. Dialog title `What's new in {version}`, pill `Updated`, close button `Got it`.
- Markdown only via `ReleaseNotes` (platform adapter). Tauri calls only inside `platform/updates/`.
- Tests first for each task. Commits follow commitlint (conventional), on the current branch `feat/update-flow`.
- Run heavy commands one at a time, scoped to a file: `pnpm exec vitest run <file>` (Node v22 path per the test-sharding note). Typecheck once at the end: `pnpm exec tsc --noEmit`.

## Review Focus

- Updater reports `1.6.0` but the saved version has a leading `v` (or vice versa): the toast should still match (compare after stripping a leading `v`). Pinned in Task 4.
- Corrupt, empty, wrong-shape or non-JSON stored value: treated as no record, no crash. Pinned in Task 1.
- Storage unavailable (throws on get/set/remove): app still starts and restarts normally. Pinned in Task 1 and Task 3.
- Install rejects (user cancels the installer): no stale record, so no false toast on a later launch. Pinned in Task 3.
- Stale record for another version (user skipped through versions or reinstalled): cleared silently, no toast. Pinned in Task 4.
- Tour running or Focus on at launch: the toast waits, then shows once. Pinned in Task 4.
- React StrictMode double-invoked effect: only one toast. Pinned in Task 4.

---

### Task 1: Pending what's-new storage

**Files:**
- Create: `src/features/updates/whats-new-storage.ts`
- Test: `src/features/updates/whats-new-storage.test.ts`

**Interfaces:**
- Produces:
  - `interface PendingWhatsNew { version: string; notes: string; publishedAt: string | null }`
  - `savePendingWhatsNew(record: PendingWhatsNew): void`
  - `loadPendingWhatsNew(): PendingWhatsNew | null`
  - `clearPendingWhatsNew(): void`

- [ ] **Step 1: Write failing tests** (model on `session-storage` tests): `round-trips a saved record`; `returns null when nothing is saved`; `returns null for invalid JSON, a non-object, or a record missing a non-empty string version`; `coerces a non-string notes to "" and a non-string publishedAt to null`; `clear removes the record`; `save, load and clear do not throw when localStorage throws` (spy `Storage.prototype` methods to throw; `load` returns `null`).
- [ ] **Step 2: Run** `pnpm exec vitest run src/features/updates/whats-new-storage.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the four exports in `whats-new-storage.ts`, mirroring `src/features/session/session-storage.ts` (constant key, try/catch with a one-line comment on why swallowing is right).
- [ ] **Step 4: Run** the same test. Expected: PASS.
- [ ] **Step 5: Commit** `feat: store the pending what's new record`.

### Task 2: `getCurrentVersion` on the update adapter

**Files:**
- Modify: `src/platform/updates/types.ts`, `src/platform/updates/desktop.ts`, `src/platform/updates/web.ts`
- Test: `src/platform/updates/desktop.test.ts`, `src/platform/updates/web.test.ts`

**Interfaces:**
- Produces: `UpdateAdapter.getCurrentVersion(): Promise<string | null>` (the running app version; `null` when unknown).

- [ ] **Step 1: Write failing tests.** Desktop: mock `@tauri-apps/api/app` (`getVersion`) next to the existing mocks; `returns the running app version` (resolves `"1.6.0"`) and `returns null when the version cannot be read` (`getVersion` rejects). Web: `returns null`.
- [ ] **Step 2: Run** `pnpm exec vitest run src/platform/updates/desktop.test.ts`, then the web test. Expected: FAIL.
- [ ] **Step 3: Implement.** Add the method to the `UpdateAdapter` interface with a doc comment. Desktop calls `getVersion()` from `@tauri-apps/api/app` and catches to `null`. Web returns `null`.
- [ ] **Step 4: Run** both test files. Expected: PASS. Other tests that build a full `UpdateAdapter` object (e.g. `update-store.test.ts`) get a `getCurrentVersion` mock when typecheck flags them.
- [ ] **Step 5: Commit** `feat: expose the running app version from the update adapter`.

### Task 3: `restart()` saves and clears the record

**Files:**
- Modify: `src/features/updates/update-store.ts` (`restart`)
- Test: `src/features/updates/update-store.test.ts`

**Interfaces:**
- Consumes: `savePendingWhatsNew`, `clearPendingWhatsNew`, `loadPendingWhatsNew` (Task 1).

- [ ] **Step 1: Write failing tests** in the `restart` describe (clear storage in `beforeEach`): `saves the version, notes and date before installing` (assert the record is already stored when `adapter.install` is called, by reading it inside the mock implementation); `does not save when blocked by unsaved changes`; `clears the record when install rejects`; `keeps the record when install succeeds but relaunch rejects` (the update is already installed); `still restarts when storage throws`.
- [ ] **Step 2: Run** `pnpm exec vitest run src/features/updates/update-store.test.ts`. Expected: new tests FAIL.
- [ ] **Step 3: Implement.** After the unsaved-changes guard, call `savePendingWhatsNew` from `get().update` (skip if `update` is null). Wrap `adapter.install()` so a rejection clears the record before falling into the existing catch; relaunch failure leaves it.
- [ ] **Step 4: Run** the test file. Expected: all PASS.
- [ ] **Step 5: Commit** `feat: remember the release notes before restarting to update`.

### Task 4: Launch hook (toast) and dialog

**Files:**
- Create: `src/components/editor-page/whats-new-dialog/whats-new-dialog.tsx`, `.../index.ts` (mirror `tour-prompt/`)
- Create: `src/features/updates/use-whats-new-on-launch.ts`
- Test: `src/components/editor-page/whats-new-dialog/whats-new-dialog.test.tsx`, `src/features/updates/use-whats-new-on-launch.test.tsx`

**Interfaces:**
- Consumes: Task 1 storage, Task 2 `getUpdateAdapter().getCurrentVersion()`, `ReleaseNotes` (`components/settings-page/release-notes.tsx`).
- Produces:
  - `WhatsNewDialog({ record, onClose }: { record: PendingWhatsNew | null; onClose: () => void })`, open when `record` is non-null.
  - `useWhatsNewOnLaunch({ deferred }: { deferred: boolean }): { dialogRecord: PendingWhatsNew | null; closeDialog: () => void }`.

- [ ] **Step 1: Write failing dialog tests** (mock the markdown adapter as `updates-card.test.tsx` does): `shows the title with the version, the Updated pill and the rendered notes`; `shows "Released <date>" only when publishedAt is a valid date`; `Got it, Escape and the close button all call onClose`; `renders nothing when record is null`.
- [ ] **Step 2: Write failing hook tests** (mock `../../platform/updates` and `sonner`'s `toast`, clear storage in `beforeEach`; pattern from `use-update-check.test.tsx`): `shows the toast once when the saved version matches the running version` (assert title, description, `duration: Infinity`, action label `What's new`, and that the record is cleared); `matches ignoring a leading "v"`; `omits the action when notes are blank`; `the action opens the dialog with the record, and closeDialog closes it`; `clears a stale record for another version without a toast`; `does nothing when there is no record or the version is unknown (null)`; `waits while deferred is true and shows once after it turns false`; `shows only one toast under StrictMode`.
- [ ] **Step 3: Run** both files one at a time. Expected: FAIL.
- [ ] **Step 4: Implement** `WhatsNewDialog` on the shadcn `Dialog` (layout and copy per the mockup, `ReleaseNotes` inside; date via `toLocaleDateString` with day, short month, year; no date line when invalid). Implement the hook: one-shot via a ref, async version lookup with cancel on unmount, clear the record when the toast is shown (so it can never appear twice), hold the record in state for the dialog.
- [ ] **Step 5: Run** both files. Expected: PASS.
- [ ] **Step 6: Commit** `feat: show a what's new toast and dialog after an update`.

### Task 5: Wire into `App`

**Files:**
- Modify: `src/App.tsx` (call the hook beside `useUpdateCheckOnLaunch`, render the dialog beside `<TourPrompt>`)
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useWhatsNewOnLaunch`, `WhatsNewDialog` (Task 4). `deferred` is `tourState.running || focusActive` (both already in `App.tsx`).

- [ ] **Step 1: Write failing test** in `App.test.tsx`: with a saved matching record and a mocked update adapter, the toast `Updated to 1.6.0` is requested once on launch; with the Tour running it is not. Mock `./platform/updates` as the file does for its other adapters.
- [ ] **Step 2: Run** `pnpm exec vitest run src/App.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the wiring.
- [ ] **Step 4: Run** `src/App.test.tsx`, then `pnpm exec tsc --noEmit`. Expected: PASS, no type errors.
- [ ] **Step 5: Commit** `feat: wire the what's new toast into the app`.

### Task 6: Verify in the real desktop app

**Files:** none.

- [ ] **Step 1:** Per the desktop CDP testing note (back up and restore the user's `settings.json`), run the app, write a matching pending record into localStorage (`markora:pending-whats-new` with the running version and sample markdown), reload, and confirm the toast appears once, does not block typing, opens the dialog, and does not return after another reload.
- [ ] **Step 2:** Screenshot the toast and dialog for the PR. Stop all dev servers and background processes, and restore the user's settings.
- [ ] **Step 3:** PR body needs a `## Diagram` section (mermaid: restart saves record, relaunch compares versions, toast, dialog) and a `## Video` placeholder, per the global PR rules.
