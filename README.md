# Markora

Markora is a desktop-first markdown editor built with Tauri v2, React, TypeScript, CodeMirror 6, Zustand, and Rust.

It includes:
- a split editor/preview layout
- live markdown rendering through a Rust command
- open/save and save-as using native file dialogs
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

If you only want the frontend dev server without the native shell:

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
  App.tsx                 App shell and file operation wiring
  components/
    Editor.tsx            CodeMirror editor wrapper
    Preview.tsx           Live HTML preview from Rust markdown parsing
    SplitPane.tsx         Draggable two-pane layout
    Toolbar.tsx           New/Open/Save/theme controls
  store/
    document.ts           Zustand document state
  styles/
    app.css               Layout and theme styles

src-tauri/
  src/
    lib.rs                Tauri app bootstrap and command registration
    main.rs               Thin binary entrypoint
    commands/
      markdown.rs         Rust markdown parsing command
      file.rs             Rust file I/O commands
```

## Notes

- Markdown parsing is intentionally done in Rust with `pulldown-cmark`
- File reads and writes are intentionally handled in Rust commands, not directly in the frontend
- Important implementation areas include inline comments to explain the Rust/Tauri bridge and editor state flow
