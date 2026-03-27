# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # Install dependencies
npm run tauri dev        # Run desktop app (Vite + Rust)
npm run dev              # Frontend dev server only
npm run build            # TypeScript check + Vite build
npx vitest run           # Run frontend tests
npx vitest run src/path/to/file.test.tsx  # Run a single test file
npx tsc --noEmit         # TypeScript type check
cd src-tauri && cargo test  # Run Rust tests
npm run tauri build      # Build release desktop app
```

## Architecture

Markora is a Tauri v2 desktop markdown editor with a split-pane layout (editor left, live preview right).

**Key architectural rules:**
- Markdown parsing happens in Rust (`src-tauri/src/commands/markdown.rs`), never in the frontend
- File I/O happens in Rust Tauri commands (`src-tauri/src/commands/file.rs`), not in browser code
- Frontend calls Rust via `invoke(...)` from `@tauri-apps/api/core`
- Document state is owned by the Zustand store in `src/store/document.ts`

**IPC commands (Rust → Frontend):**
- `parse_markdown(markdown)` → returns HTML string
- `read_file(path)` → returns file content string
- `write_file(path, content)` → returns void

**State management (Zustand stores):**
- `src/store/document.ts` — document tabs, active doc, content, file path, dirty flag
- `src/features/workspace/workspace-state.ts` — view mode (split/editor-only/preview-only)
- `src/features/workspace/editor-status-state.ts` — cursor position
- `src/features/theme/theme-store.ts` — light/dark theme

**Component hierarchy:**
```
App.tsx (file ops, keyboard shortcuts: Ctrl+N/O/S/Shift+S/Tab)
└── AppShell
    ├── TopBar (toolbar actions)
    ├── TabStrip (document tabs)
    ├── Workspace
    │   ├── EditorPane (CodeMirror 6 wrapper)
    │   └── PreviewPane (dangerouslySetInnerHTML from Rust HTML)
    └── FooterStatusBar
```

**Rust backend entry:** `src-tauri/src/lib.rs` registers all Tauri commands and plugins (dialog, opener).

## Implementation Guidance

- Use `Result<T, String>` for Rust commands that can fail
- Add tests before changing store logic, Rust commands, or UI behavior
- If a change affects markdown rendering, update tests in `src-tauri/src/commands/markdown.rs`
- If a change affects save/open behavior, update `src-tauri/src/commands/file.rs` tests and `src/App.tsx`
- Keep Zustand as the source of truth for editor state
