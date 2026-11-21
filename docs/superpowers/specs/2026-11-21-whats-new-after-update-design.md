# What's new after an update: design

Small change, desktop only. Mockup approved: `.lavish/whats-new-mockup.html` (git-ignored, local).

## Intent

After an update installed from inside Markora relaunches, the user gets no confirmation and never sees what changed: the release notes live only in `useUpdateStore.update`, which is gone after the restart. Show a quiet, once-only "Updated to x.y.z" toast whose action opens the release notes.

## Goals

- Toast on the first launch after an in-app update, with a "What's new" action that opens a dialog with the notes.
- Never blocks typing, never shows twice, works offline.

## Non-goals / anti-goals

- No auto-opening modal on launch (a failure even if it works).
- No notes for fresh installs or manual MSI installs (nothing saved, so nothing shown).
- No way to reopen the dialog later (the Updates card covers the current release).
- No web behaviour; updates are desktop only.
- No `MarkoraSettings` change. (Amended: the record is now persisted by Rust, see the Amendment below.)

## Approaches considered

- **A. localStorage "pending what's new" record (chosen).** Matches `session-storage.ts` and `view-mode-storage.ts`; offline; no schema change. Cost: clearing webview storage loses one toast.
- B. `MarkoraSettings`. Survives storage wipes, but means a schema + `settings.rs` + `normalizeSettings` + catalog change for state that is not a preference, and "Reset settings" would wipe it.
- C. Fetch notes after relaunch. Covers manual installs, but fails offline and adds a network call to every launch.

## Design

- `features/updates/whats-new-storage.ts`: `{ version, notes, publishedAt }` under `markora:pending-whats-new`. `save`, `load` (validates shape, corrupt means none), `clear`; try/catch around storage like `session-storage.ts`.
- `update-store.ts` `restart()`: save the record from `get().update` just before `adapter.install()`. If install rejects, clear it so a failed attempt cannot show a toast later.
- `UpdateAdapter` gains `getCurrentVersion()` (Tauri `getVersion()` on desktop, inside the adapter only; web returns `null`).
- `useWhatsNewOnLaunch` (new hook in `app/hooks/`, called from `App.tsx` beside `useUpdateCheckOnLaunch`): on desktop, load the record; show only if `record.version === currentVersion`. A mismatch or no record clears nothing visible and, for a stale mismatched record, clears it.
- Toast: sonner, `duration: Infinity`, title "Updated to x.y.z", description "Markora is up to date.", action "What's new" only when `notes.trim()` is non-empty. Dismiss and action both clear the record.
- Dialog: shadcn `Dialog`, title "What's new in x.y.z", "Updated" pill, "Released <date>" only when `publishedAt` exists, notes via the existing `ReleaseNotes`, "Got it" closes.
- Deferred while the Tour runs or Focus is on; shown after they end. The record is only cleared once the toast is actually shown.

## Constraints

- Markdown only through `getMarkdownAdapter()` (via `ReleaseNotes`), never a JS markdown lib on desktop.
- Frontend never calls Tauri outside the platform adapter.
- Add tests first for the store/hook logic. Updates only exist on desktop, so verify in the real app (CDP, per the desktop testing notes).

## Left to the builder

Exact toast copy polish, the date format, file names beyond the above, and where the dialog component lives (likely `components/editor-page/whats-new-dialog.tsx`).

## Amendment (after the final review): Rust-backed record

**Why:** on Windows the updater exits the app inside `install()`. WebView2 writes localStorage to disk on a delay, so the record saved just before `install()` may never reach disk and the toast would silently never show on the only shipped platform. This could not be ruled out without a real signed update, so the record moves to a file Rust writes and syncs before returning. Approved by the user.

**Changes to the design above:**
- Rust: new `commands/whats_new.rs` with `save_pending_whats_new(record)`, `load_pending_whats_new() -> Option<record>` and `clear_pending_whats_new()`, storing `pending-whats-new.json` in the app config dir (next to `settings.json`). Save writes a temp file, `sync_all`, then renames over the real one, so a kill mid-write never leaves a torn record. A missing or corrupt file loads as none. `MarkoraSettings` is untouched.
- Frontend: the localStorage module `whats-new-storage.ts` is removed. The three operations become `UpdateAdapter.savePendingWhatsNew / loadPendingWhatsNew / clearPendingWhatsNew` (desktop: `invoke`; web: no-ops, load returns null), so components still never call Tauri directly. `PendingWhatsNew` moves to `platform/updates/types.ts`.
- `restart()` awaits the save before `install()`. A failed save does not block the update. A rejected install clears the record (best effort).
- The hook loads the record through the adapter, so it is asynchronous. It marks the run handled before awaiting the clear, so a Tour/Focus flip during the clear cannot lose the toast.
- Tests: Rust unit tests for the three functions; the existing frontend tests move to the adapter.
