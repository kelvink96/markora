# Markora

Markora is a markdown editor available as both a native desktop app and a browser-based local-first web app.

**Desktop** — built with Tauri v2, React, TypeScript, CodeMirror 6, Zustand, and Rust. Markdown rendering and file I/O happen in Rust.

**Web** — runs in the browser with no account or server required. Uses the File System Access API where available, and falls back to IndexedDB-backed browser workspaces. Markdown rendering uses a browser-side renderer.

It includes:
- a split editor/preview layout with live rendering
- multi-project workspace with file tree and recents
- open/save using native dialogs (desktop) or browser file APIs (web)
- import and export of markdown files on the web
- light/dark theme switching

## Prerequisites

Before running the app, make sure you have:
- Node.js and npm
- Rust via `rustup`
- Tauri desktop prerequisites for your OS

Windows:
- Rust MSVC toolchain
- WebView2 runtime
- Microsoft C++ Build Tools if Rust or Tauri asks for them

## Install

```bash
npm install
```

## Run The App

Start the desktop app in development mode:

```bash
npm run tauri dev
```

What happens:
- Vite starts the frontend dev server on `http://127.0.0.1:1420`
- Tauri launches the native desktop window
- frontend code calls Rust commands through Tauri `invoke(...)`

If you only want the frontend dev server without the native shell (runs as a browser web app):

```bash
npm run dev
```

## Test And Verify

Run the frontend tests:

```bash
npx vitest run
```

Run the TypeScript check:

```bash
npx tsc --noEmit
```

Run the Rust tests:

```bash
cd src-tauri
cargo test
```

## Build

Build the frontend bundle:

```bash
npm run build
```

Build the desktop app:

```bash
npm run tauri build
```

## Project Structure

```text
src/
  App.tsx                         App shell, keyboard shortcuts, file operations
  platform/
    runtime.ts                    Detects desktop vs web at runtime
    files/
      types.ts                    FileAdapter interface
      desktop.ts                  Tauri file adapter
      web.ts                      Browser file adapter (File System Access API + import/export)
    markdown/
      types.ts                    MarkdownAdapter interface
      desktop.ts                  Tauri markdown adapter (delegates to Rust)
      web.ts                      Browser markdown adapter (marked + DOMPurify)
    persistence/
      web.ts                      IndexedDB workspace snapshot persistence
  store/
    document.ts                   Zustand workspace/project/document state
  features/
    settings/                     Settings schema, API (desktop + web), store
    workspace/                    View mode and editor status state
    theme/                        Theme store
    document/                     Display name and word count helpers
    editor/                       Toolbar actions, slash commands, command state
  components/
    editor-page/
      editor-pane/                CodeMirror 6 editor
      preview-pane/               Live HTML preview
      workspace/                  Split pane layout
      workspace-sidebar/          Project, file, and recents sidebar
      top-bar/                    Command bar and menus
      tab-strip/                  Document tabs
      footer-status-bar/          Word count and cursor position
  app/
    app-shell/                    Root layout shell

src-tauri/
  src/
    lib.rs                        Tauri command registration
    commands/
      markdown.rs                 Rust markdown rendering (pulldown-cmark)
      file.rs                     Rust file I/O commands
```

## Platform Notes

- On desktop, markdown rendering and file I/O go through Rust Tauri commands.
- On web, the app detects `window.__TAURI_INTERNALS__` to choose adapters at startup.
- Web file access uses the File System Access API when available; falls back to `<input type="file">` import and `<a download>` export.
- Web workspace state is persisted to IndexedDB and rehydrated on next load.
- See [docs/markora-web-capabilities.md](docs/markora-web-capabilities.md) for the full web capability reference.
