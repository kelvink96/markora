# Markora Web Capabilities

This document describes what the Markora web app supports, how it differs from the desktop app, and how the browser fallback tiers work.

---

## Platform Detection

At startup, `src/platform/runtime.ts` checks for `window.__TAURI_INTERNALS__` to decide whether to wire the desktop or web adapters. All platform-specific behavior — file access, markdown rendering, settings persistence — goes through these adapters. UI components never call Tauri or browser APIs directly.

---

## File Access

Markora Web supports three file access modes, applied in order of capability:

### 1. Filesystem-backed workspaces (File System Access API)

- Available in Chromium-based browsers (Chrome, Edge, Arc) and some others.
- Users click **Open folder** to grant access to a directory on disk.
- The app reads all `.md`, `.markdown`, and `.txt` files in that directory recursively.
- Saves write directly back to the original files via `FileSystemFileHandle.createWritable()`.
- `webFileAdapter.supportsDirectoryAccess()` returns `true` when `window.showDirectoryPicker` is present.

### 2. Browser file import (file picker)

- Available in all modern browsers.
- Users click **Import files** to select one or more markdown files from a native file picker.
- Files are read into browser memory; changes are not written back to disk automatically.
- Users export changes via **Save** which triggers a `<a download>` browser download.
- `webFileAdapter.supportsFileImport()` returns `true` when `document` is defined.

### 3. Export-only save

- Always available.
- When saving a document that has no filesystem handle, `Save` exports the content as a downloadable `.md` file.
- The filename is derived from the document title or first heading.

---

## Workspace Persistence

Browser-backed workspaces are saved to IndexedDB under the `markora-web` database.

- The full workspace snapshot (projects, documents, active project, recents) is written to `IndexedDB` after every state change.
- On next load, the snapshot is read and the workspace is rehydrated before the first render.
- If IndexedDB is unavailable (private browsing in some browsers), an in-memory fallback is used. State is lost when the tab is closed.

---

## Settings Persistence

- Desktop: settings are read/written via the Tauri `load_settings` / `save_settings` / `reset_settings` Rust commands and persisted to a platform config file.
- Web: settings are read/written via `localStorage` under the key `markora:web-settings`. The format is the same JSON structure as the desktop settings file.

---

## Markdown Rendering

- Desktop: markdown is parsed in Rust using `pulldown-cmark`, invoked via `parse_markdown` Tauri command.
- Web: markdown is parsed in the browser using `marked` with `DOMPurify` sanitization.

The two renderers produce similar but not identical HTML. Known differences:

- Table alignment attributes differ slightly.
- Task list checkbox rendering may vary.
- Edge cases in nested list handling may produce different nesting depth.

These differences are cosmetic in most documents. If a user relies on precise preview output for a specific rendering behavior, the desktop app is the reference renderer.

---

## PWA Installation

The web app includes a PWA manifest (`public/site.webmanifest`). When the browser exposes a `beforeinstallprompt` event, an **Install app** button appears in the top bar. Clicking it invokes the browser's native install prompt. After installation, the app runs in a standalone window without browser chrome.

---

## Unsupported Browsers

The following features degrade gracefully when the browser does not support them:

| Feature | Fallback |
|---|---|
| File System Access API | Import/export via file picker and `<a download>` |
| IndexedDB | In-memory workspace state (not persisted across sessions) |
| PWA install prompt | Install button does not appear |

---

## Desktop vs Web Summary

| Capability | Desktop | Web |
|---|---|---|
| Markdown rendering | Rust (pulldown-cmark) | Browser (marked + DOMPurify) |
| File open/save | Native dialogs via Tauri | File System Access API or import/export |
| Workspace persistence | OS file system | IndexedDB |
| Settings persistence | OS config file | localStorage |
| Multi-project workspaces | Via tab/document model | Full project + file tree |
| PWA install | N/A (native app) | Supported via beforeinstallprompt |
| Offline use | Always offline | Fully offline after first load |
