# Markora Markdown Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop-first cross-platform markdown editor (like Typedown) with a live split-pane preview, file open/save, and light/dark theming.

**Architecture:** Tauri v2 wraps a React + TypeScript frontend. Markdown parsing happens in Rust (pulldown-cmark) and is exposed as a Tauri command the frontend calls via `invoke`. File I/O is also handled by custom Rust commands. All editor state lives in a Zustand store.

**Tech Stack:** Tauri v2 · Rust (pulldown-cmark) · React 18 · TypeScript · CodeMirror 6 · Zustand · Vite · Vitest

---

## File Map

```text
markora/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                   # binary entry point (thin wrapper)
│   │   ├── lib.rs                    # registers plugins + commands, runs app
│   │   └── commands/
│   │       ├── mod.rs                # re-exports submodules
│   │       ├── markdown.rs           # parse_markdown command + unit tests
│   │       └── file.rs               # read_file / write_file commands + tests
│   ├── capabilities/
│   │   └── default.json              # Tauri v2 permission grants
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
├── src/
│   ├── main.tsx                      # React entry
│   ├── App.tsx                       # root: layout + file ops + keyboard shortcuts
│   ├── components/
│   │   ├── Editor.tsx                # CodeMirror 6 wrapper
│   │   ├── Preview.tsx               # renders HTML from Rust
│   │   ├── SplitPane.tsx             # draggable split layout
│   │   └── Toolbar.tsx               # New / Open / Save / Theme toggle
│   ├── store/
│   │   └── document.ts               # Zustand store (content, filePath, isDirty)
│   ├── test/
│   │   └── setup.ts                  # vitest + testing-library bootstrap
│   └── styles/
│       └── app.css                   # CSS variables, layout, prose styles
├── vite.config.ts                    # Vite + Vitest config
├── tsconfig.json
└── package.json
```

---

## Task 1: Bootstrap the Tauri v2 project

**Files:**
- Create: entire project tree via `npm create tauri-app`

- [ ] **Step 1: Scaffold**

```bash
cd D:/works/design-sparx
npm create tauri-app@latest markora -- --template react-ts --manager npm
cd markora
```

When prompted interactively (if the `--` args don't suppress prompts):
- Project name: `markora`
- Package manager: `npm`
- UI template: `React`
- UI flavor: `TypeScript`

- [ ] **Step 2: Verify the scaffold compiles**

```bash
npm install
npm run tauri dev
```

Expected: A native window opens with the default Tauri + React starter page. Close it with `Ctrl+C`.

- [ ] **Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Tauri v2 + React + TypeScript"
```

---

## Task 2: Add Rust and npm dependencies

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Update `src-tauri/Cargo.toml`**

Replace the `[dependencies]` and add `[build-dependencies]` so the file reads:

```toml
[package]
name = "markora"
version = "0.1.0"
edition = "2021"

[lib]
name = "markora_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri              = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-dialog = "2"
serde              = { version = "1", features = ["derive"] }
serde_json         = "1"
pulldown-cmark     = "0.12"

[profile.release]
codegen-units = 1
lto           = true
opt-level     = "s"
panic         = "abort"
strip         = true
```

- [ ] **Step 2: Install npm dependencies**

```bash
npm install codemirror @codemirror/lang-markdown @codemirror/theme-one-dark @codemirror/state @codemirror/view @tauri-apps/plugin-dialog zustand
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Update `vite.config.ts`** to enable Vitest

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: add pulldown-cmark, CodeMirror 6, Zustand, Vitest"
```

---

## Task 3: Rust — markdown parsing command (TDD)

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/markdown.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Create `src-tauri/src/commands/mod.rs`**

```rust
pub mod file;
pub mod markdown;
```

- [ ] **Step 2: Write the failing tests in `src-tauri/src/commands/markdown.rs`**

```rust
use pulldown_cmark::{html, Options, Parser};

#[tauri::command]
pub fn parse_markdown(markdown: &str) -> String {
    todo!("not implemented yet")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heading() {
        let result = parse_markdown("# Hello World");
        assert_eq!(result.trim(), "<h1>Hello World</h1>");
    }

    #[test]
    fn test_bold() {
        let result = parse_markdown("**bold**");
        assert_eq!(result.trim(), "<p><strong>bold</strong></p>");
    }

    #[test]
    fn test_strikethrough() {
        let result = parse_markdown("~~strike~~");
        assert_eq!(result.trim(), "<p><del>strike</del></p>");
    }

    #[test]
    fn test_table() {
        let md = "| A | B |\n|---|---|\n| 1 | 2 |";
        let result = parse_markdown(md);
        assert!(result.contains("<table>"));
        assert!(result.contains("<td>1</td>"));
    }

    #[test]
    fn test_tasklist() {
        let md = "- [ ] todo\n- [x] done";
        let result = parse_markdown(md);
        assert!(result.contains(r#"type="checkbox""#));
    }
}
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd src-tauri && cargo test commands::markdown
```

- [ ] **Step 4: Implement `parse_markdown`**

```rust
#[tauri::command]
pub fn parse_markdown(markdown: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(markdown, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);
    html_output
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cargo test commands::markdown
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add src-tauri/src/commands/
git commit -m "feat(rust): add markdown parsing command with pulldown-cmark"
```

---

## Task 4: Rust — file I/O commands (TDD)

**Files:**
- Create: `src-tauri/src/commands/file.rs`

- [ ] **Step 1: Write failing tests in `src-tauri/src/commands/file.rs`**

```rust
use std::fs;

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    todo!()
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn tmp(name: &str) -> String {
        env::temp_dir()
            .join(name)
            .to_str()
            .unwrap()
            .to_string()
    }

    #[test]
    fn test_read_file() {
        let path = tmp("markora_read_test.md");
        fs::write(&path, "# Test Content").unwrap();
        let result = read_file(path.clone());
        assert_eq!(result.unwrap(), "# Test Content");
        fs::remove_file(&path).ok();
    }

    #[test]
    fn test_write_file() {
        let path = tmp("markora_write_test.md");
        let result = write_file(path.clone(), "# Written".to_string());
        assert!(result.is_ok());
        assert_eq!(fs::read_to_string(&path).unwrap(), "# Written");
        fs::remove_file(&path).ok();
    }

    #[test]
    fn test_read_missing_file_returns_err() {
        let result = read_file("/nonexistent/path/file.md".to_string());
        assert!(result.is_err());
    }
}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd src-tauri && cargo test commands::file
```

- [ ] **Step 3: Implement both commands**

```rust
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cargo test commands::file
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add src-tauri/src/commands/file.rs
git commit -m "feat(rust): add read_file and write_file commands"
```

---

## Task 5: Register commands and configure Tauri

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/capabilities/default.json`

- [ ] **Step 1: Update `src-tauri/src/lib.rs`**

```rust
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::markdown::parse_markdown,
            commands::file::read_file,
            commands::file::write_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 2: Confirm `src-tauri/src/main.rs` is the thin wrapper**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    markora_lib::run();
}
```

- [ ] **Step 3: Update `src-tauri/tauri.conf.json`**

```json
{
  "productName": "Markora",
  "version": "0.1.0",
  "identifier": "com.markora.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Markora",
        "width": 1200,
        "height": 800,
        "minWidth": 640,
        "minHeight": 480
      }
    ],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 4: Update `src-tauri/capabilities/default.json`**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "dialog:default"
  ]
}
```

- [ ] **Step 5: Verify Rust still compiles**

```bash
cd src-tauri && cargo build
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add src-tauri/src/lib.rs src-tauri/src/main.rs src-tauri/tauri.conf.json src-tauri/capabilities/
git commit -m "feat(tauri): register all commands, configure window and permissions"
```

---

## Task 6: Document store (Zustand)

**Files:**
- Create: `src/store/document.ts`
- Create: `src/store/document.test.ts`

- [ ] **Step 1: Write failing tests in `src/store/document.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from './document'

describe('DocumentStore', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      content: '',
      filePath: null,
      isDirty: false,
    })
  })

  it('setContent marks the document dirty', () => {
    useDocumentStore.getState().setContent('# Hello')
    expect(useDocumentStore.getState().content).toBe('# Hello')
    expect(useDocumentStore.getState().isDirty).toBe(true)
  })

  it('markClean clears the dirty flag', () => {
    useDocumentStore.getState().setContent('# Hello')
    useDocumentStore.getState().markClean()
    expect(useDocumentStore.getState().isDirty).toBe(false)
  })

  it('setFilePath stores the path without affecting dirty', () => {
    useDocumentStore.getState().setFilePath('/home/user/notes.md')
    expect(useDocumentStore.getState().filePath).toBe('/home/user/notes.md')
    expect(useDocumentStore.getState().isDirty).toBe(false)
  })

  it('newDocument resets all state', () => {
    useDocumentStore.getState().setContent('old')
    useDocumentStore.getState().setFilePath('/old.md')
    useDocumentStore.getState().newDocument()
    const { content, filePath, isDirty } = useDocumentStore.getState()
    expect(content).toBe('')
    expect(filePath).toBeNull()
    expect(isDirty).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/store/document.test.ts
```

- [ ] **Step 3: Create `src/store/document.ts`**

```ts
import { create } from 'zustand'

interface DocumentStore {
  content: string
  filePath: string | null
  isDirty: boolean
  setContent: (content: string) => void
  setFilePath: (path: string | null) => void
  markClean: () => void
  newDocument: () => void
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  content: '# Welcome to Markora\n\nStart writing your markdown here...\n\n## Features\n\n- **Live preview** as you type\n- Open and save `.md` files\n- Light and dark themes\n',
  filePath: null,
  isDirty: false,
  setContent: (content) => set({ content, isDirty: true }),
  setFilePath: (filePath) => set({ filePath }),
  markClean: () => set({ isDirty: false }),
  newDocument: () => set({ content: '', filePath: null, isDirty: false }),
}))
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/store/document.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/store/ src/test/
git commit -m "feat(store): add Zustand document store with TDD"
```

---

## Task 7: Editor component (CodeMirror 6)

**Files:**
- Create: `src/components/Editor.tsx`
- Create: `src/components/Editor.test.tsx`

- [ ] **Step 1: Write a smoke test in `src/components/Editor.test.tsx`**
- [ ] **Step 2: Run test to confirm it fails**
- [ ] **Step 3: Create `src/components/Editor.tsx`**
- [ ] **Step 4: Run test to confirm it passes**
- [ ] **Step 5: Commit**

Implementation follows the CodeMirror-backed editor described in the plan that was reviewed in-session:
- initialize `EditorView` inside a React effect
- use `markdown()` and `basicSetup`
- attach an update listener that writes changes into the Zustand store
- rebuild on theme change
- sync external store content into the editor without re-creating the view

---

## Task 8: Preview component

**Files:**
- Create: `src/components/Preview.tsx`
- Create: `src/components/Preview.test.tsx`

- [ ] **Step 1: Write failing test in `src/components/Preview.test.tsx`**
- [ ] **Step 2: Run test to confirm it fails**
- [ ] **Step 3: Create `src/components/Preview.tsx`**
- [ ] **Step 4: Run test to confirm it passes**
- [ ] **Step 5: Commit**

Implementation uses `invoke('parse_markdown', { markdown: content })` and renders the resulting HTML into `.preview-container`.

---

## Task 9: SplitPane component

**Files:**
- Create: `src/components/SplitPane.tsx`
- Create: `src/components/SplitPane.test.tsx`

- [ ] **Step 1: Write failing test in `src/components/SplitPane.test.tsx`**
- [ ] **Step 2: Run test to confirm it fails**
- [ ] **Step 3: Create `src/components/SplitPane.tsx`**
- [ ] **Step 4: Run test to confirm it passes**
- [ ] **Step 5: Commit**

Implementation uses a draggable divider, stores left-pane width as a percentage, and clamps the divider between 20% and 80%.

---

## Task 10: Toolbar component

**Files:**
- Create: `src/components/Toolbar.tsx`
- Create: `src/components/Toolbar.test.tsx`

- [ ] **Step 1: Write failing test in `src/components/Toolbar.test.tsx`**
- [ ] **Step 2: Run test to confirm it fails**
- [ ] **Step 3: Create `src/components/Toolbar.tsx`**
- [ ] **Step 4: Run tests to confirm they pass**
- [ ] **Step 5: Commit**

Implementation includes `New`, `Open`, `Save`, `Save As`, a filename display with dirty indicator, and a theme toggle.

---

## Task 11: Wire up `App.tsx` with file operations and keyboard shortcuts

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx` entirely**
- [ ] **Step 2: Confirm TypeScript compiles cleanly**
- [ ] **Step 3: Commit**

Implementation:
- manages light/dark theme in component state
- uses Tauri dialog `open`/`save`
- calls Rust `read_file`/`write_file`
- wires `Ctrl/Cmd+N`, `Ctrl/Cmd+O`, `Ctrl/Cmd+S`, and `Ctrl/Cmd+Shift+S`
- renders `Toolbar`, `SplitPane`, `Editor`, and `Preview`

---

## Task 12: CSS — layout and light/dark theme

**Files:**
- Create: `src/styles/app.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create `src/styles/app.css`**
- [ ] **Step 2: Import CSS in `src/main.tsx`**
- [ ] **Step 3: Commit**

Implementation covers:
- CSS variables for light and dark themes
- app shell, toolbar, split pane, editor container
- preview prose styling for headings, code, tables, lists, blockquotes, and images

---

## Task 13: End-to-end verification

- [ ] **Step 1: Run all unit tests**

```bash
npx vitest run
```

- [ ] **Step 2: Run TypeScript type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Run Rust tests**

```bash
cd src-tauri && cargo test
```

- [ ] **Step 4: Launch the full app**

```bash
cd ..
npm run tauri dev
```

Manual checklist:
- [ ] App opens with editor on left, preview on right
- [ ] Typing in the editor updates the preview in real time
- [ ] `Ctrl+N` clears the editor
- [ ] `Ctrl+O` opens the file picker; selecting a `.md` file loads it
- [ ] `Ctrl+S` saves to the current file (or opens picker for untitled)
- [ ] `Shift+Ctrl+S` opens Save As picker
- [ ] Toolbar title shows filename + `•` when unsaved
- [ ] Theme toggle switches light ↔ dark
- [ ] Divider is draggable

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: Markora MVP — live markdown editor with file ops and theming"
```

---

## What's NOT in this plan (follow-up work)

- Syntax highlighting in the preview
- Native OS menu bar
- Recent files list
- Word count / reading time in the toolbar
- Export to HTML or PDF
- Mobile / web build targets
