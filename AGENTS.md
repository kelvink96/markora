# AGENTS

## Repository Rules

- Commit messages should follow commitlint rules.

## Project Summary

Markora is a desktop-first markdown editor built with:
- Tauri v2
- Rust
- React
- TypeScript
- CodeMirror 6
- Zustand
- Vite
- Vitest

The app uses a split-pane layout with a markdown editor on the left and a live preview on the right.

## Architecture Rules

- Markdown parsing happens in Rust, not in the frontend.
- File reads and writes happen in Rust Tauri commands, not directly in browser-side code.
- Frontend code calls Rust through `invoke(...)`.
- Document state lives in the Zustand store in [document.ts](D:/works/design-sparx/markora/src/store/document.ts).
- The main Tauri command registration lives in [lib.rs](D:/works/design-sparx/markora/src-tauri/src/lib.rs).

## Important Files

- [App.tsx](D:/works/design-sparx/markora/src/App.tsx): app shell, file operations, keyboard shortcuts
- [Editor.tsx](D:/works/design-sparx/markora/src/components/Editor.tsx): CodeMirror wrapper
- [Preview.tsx](D:/works/design-sparx/markora/src/components/Preview.tsx): live preview driven by Rust markdown rendering
- [document.ts](D:/works/design-sparx/markora/src/store/document.ts): Zustand store
- [markdown.rs](D:/works/design-sparx/markora/src-tauri/src/commands/markdown.rs): markdown parsing command
- [file.rs](D:/works/design-sparx/markora/src-tauri/src/commands/file.rs): file I/O commands

## Development Commands

Install dependencies:

```bash
npm install
```

Run the frontend dev server:

```bash
npm run dev
```

Run the native desktop app:

```bash
npm run tauri dev
```

Run frontend tests:

```bash
npx vitest run
```

Run TypeScript checks:

```bash
npx tsc --noEmit
```

Run Rust tests:

```bash
cd src-tauri
cargo test
```

## Implementation Guidance

- Keep Rust command interfaces simple and serializable.
- Prefer `Result<T, String>` for Rust commands that can fail.
- Add tests before implementing new behavior when changing store logic, Rust commands, or UI behavior.
- Keep inline comments focused on important concepts, especially around Rust/Tauri integration and editor synchronization.
- Preserve the current split-pane markdown editor workflow unless the task explicitly changes product behavior.

## Notes For Future Changes

- If a change affects markdown rendering, update Rust tests in [markdown.rs](D:/works/design-sparx/markora/src-tauri/src/commands/markdown.rs).
- If a change affects save/open behavior, update Rust file command tests and app wiring in [App.tsx](D:/works/design-sparx/markora/src/App.tsx).
- If a change affects editor state, keep Zustand as the source of truth.
