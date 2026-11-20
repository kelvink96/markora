# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository. `CLAUDE.md` just imports it.

## Repository Rules

- Commit messages follow commitlint rules.

## Commands

```bash
pnpm install             # Install dependencies (pnpm is the package manager; pnpm-lock.yaml is the only lockfile)
pnpm tauri dev           # Run desktop app (Vite + Rust); alias: pnpm dev:desktop
pnpm dev                 # Frontend dev server only
pnpm build               # TypeScript check + Vite build
pnpm exec vitest run     # Run frontend tests
pnpm exec vitest run src/path/to/file.test.tsx  # Run a single test file
pnpm exec tsc --noEmit # TypeScript type check
cd src-tauri && cargo test  # Run Rust tests
pnpm tauri build         # Build release desktop app
```

## Architecture

Markora is a two-platform markdown editor:
- **Desktop:** Tauri v2 native app. Markdown rendering and file I/O happen in Rust.
- **Web:** Browser-based local-first editor. Markdown rendering and file I/O use browser adapters.

`src/platform/runtime.ts` detects which platform is active at startup by checking `window.__TAURI_INTERNALS__`. All platform-specific behavior goes through adapter interfaces — UI components never call Tauri or browser APIs directly.

**Key architectural rules:**
- On desktop, markdown parsing happens in Rust (`src-tauri/src/commands/markdown.rs`); never call a JS markdown lib from desktop code
- On web, markdown parsing uses the `webMarkdownAdapter` in `src/platform/markdown/web.ts` (marked)
- `PreviewPane` sanitizes rendered HTML from either platform with DOMPurify before inserting it
- File I/O on desktop goes through Rust Tauri commands via `desktopFileAdapter`; on web it uses `webFileAdapter` (File System Access API, import/export)
- Frontend calls Rust via `invoke(...)` from `@tauri-apps/api/core` only inside platform adapter implementations, not in components
- Document state is owned by the Zustand store in `src/store/document/`

**Platform adapters (`src/platform/`):**
- `runtime.ts` — `detectPlatform()` returns `"desktop"` or `"web"`
- `files/types.ts` — `FileAdapter` interface
- `files/desktop.ts` / `files/web.ts` — platform implementations
- `files/index.ts` — `getFileAdapter()` selects the right adapter
- `markdown/types.ts` — `MarkdownAdapter` interface
- `markdown/desktop.ts` / `markdown/web.ts` — platform implementations
- `markdown/index.ts` — `getMarkdownAdapter()` selects the right adapter
- `links/` — `LinkAdapter.openExternal` (desktop opener plugin / browser)
- `updates/` — `UpdateAdapter` (check, download, install, relaunch; real on desktop only)
- `persistence/web.ts` — IndexedDB workspace snapshot (web-only)

**IPC commands (Rust → Frontend):**
- `parse_markdown(markdown, documentPath)` → returns HTML string; relative image links resolve against the document folder via the asset protocol
- `pick_open_path()` / `pick_save_path(defaultPath)` → native dialogs; the picked path joins a per-session allowlist
- `read_file(path)` / `write_file(path, content)` → only work on allowlisted (user-picked) paths
- `take_pending_open_paths()` → files the app was launched with ("Open with", double-click); later launches are forwarded to the running window as an `open-files` event (single-instance plugin). Both are allowlisted like dialog picks and opened by `useExternalOpen`
- `load_settings()` / `save_settings(settings)` / `reset_settings()` → persist `MarkoraSettings` to disk

**State management (Zustand stores):**
- `src/store/document/` — workspace projects, document tabs, active doc, content, file path, dirty flag, recents
- `src/features/workspace/workspace-state.ts` — view mode (write/split/read), Show syntax, Focus and Outline panel state; mode and syntax are persisted by `view-mode-storage.ts` (localStorage `markora:view-mode`, `markora:show-syntax`). See **Views** below
- `src/features/updates/update-store.ts` — in-app update status (desktop)
- `src/features/workspace/editor-status-state.ts` — cursor position
- `src/features/theme/theme-store.ts` — light/dark theme
- `src/features/settings/settings-store.ts` — persisted user settings

**Feature layer (`src/features/`):**
Business logic that is independent of UI components lives here:
- `document/` — `getDisplayFileName`, `getWordCount`
- `editor/` — `markdown-toolbar-actions.ts` (apply formatting), `slash-commands.ts` (/ command palette), `editor-command-state.ts`, `find-replace.ts`, `live/` (inline rendering in Write), `focus/` (paragraph dimming)
- `outline/` — heading extraction, section moves, scroll-to-heading
- `commands/` — palette commands and menu layout; `tour/`, `session/`, `preview/`, `export/`, `updates/` — see **Other logic**
- `settings/` — `settings-schema.ts` defines the full `MarkoraSettings` type and defaults; `settings-api.ts` wraps IPC on desktop and localStorage on web; `settings-store.ts` is the Zustand store
- `workspace/`, `theme/` — view-mode and theme stores

**Component hierarchy:**
```
App.tsx (file ops, keyboard shortcuts: Ctrl+N/O/S/Shift+S/Shift+F/K/Tab, web lifecycle)
└── AppShell
    ├── TopBar (menus, view controls, web install button)
    │   └── TabStrip (document tabs, on their own row)
    ├── Workspace
    │   ├── sidebar slot: OutlinePanel (when Outline is on)
    │   ├── EditorPane (CodeMirror 6 wrapper)
    │   └── PreviewPane (HTML from platform markdown adapter)
    └── FooterStatusBar
```

Also in `src/components/editor-page/`: `ViewModeSwitcher` (Write / Side-by-side / Read + Show syntax toggle), `OutlinePanel`, `FindBar`, `CommandPalette`, `Tour`/`TourPrompt`, `FormattingToolbar`, `SlashCommandMenu`. App-level effects live in `src/app/hooks/` (autosave, session restore, external open, export, updates, keyboard shortcuts, theme sync).

**Rust backend entry:** `src-tauri/src/lib.rs` registers all Tauri commands and plugins (single-instance, opener, dialog, clipboard-manager, updater, process).

## Views

- `WorkspaceViewMode` is `write | split | read` (labelled Write, Side-by-side, Read). Write renders markdown inline (`features/editor/live/`); **Show syntax** (`showSyntax`, persisted as `markora:show-syntax`) turns that rendering off to show raw markdown. Show syntax only applies in Write.
- The editor stays mounted across all views; Read hides it and makes the formatting bar inert.
- `view-mode-storage.ts` migrates the old four-mode values (`live` → Write, syntax off; `edit` → Write, syntax on; `preview` → Read). New installs get Write with syntax off; existing installs with no saved mode keep syntax on. Don't change these defaults without keeping the migration.
- **Focus** (`focusMode`, `Ctrl/Cmd+Shift+F`, command `view.focus`): hides the chrome, centres the editor and dims every paragraph but the current one (`features/editor/focus/focus-dimming.ts`, gated by the `editor.focusDimming` setting). Never persisted, only valid in Write: leaving Write or starting the Tour ends it.
- **Outline** (`showOutline`): panel of headings with word counts and drag handles. Section moves are pure (`features/outline/sections.ts`) and applied to the live document as one undoable CodeMirror transaction (`apply-section-move.ts`); headings are always re-read from the document, never from stale state.
- Commands: view/menu entries are defined once in `features/commands/palette-commands.ts` (ids like `view.mode.write`, `view.syntax`, `view.focus`, `view.outline`) and laid out in `menu-layout.ts`. Add new commands there so the menus and the palette stay in sync (a test checks every menu id exists).

## Other logic

- **Tour** (`features/tour/`): `TOUR_STOPS` point at `data-tour` anchors and may open a panel (e.g. outline) and restore the layout afterwards. Offered once per `CURRENT_TOUR_VERSION` (`onboarding` settings); bump it to re-offer after adding stops.
- **Updates** (desktop only, `features/updates/` + `platform/updates/`): `useUpdateStore` goes check → download → ready → restart; install is a separate step and `restart` refuses while any tab is unsaved (Windows exits the app on install). Checks run at launch when `updates.checkAutomatically` is on. Releases are published by CI (`.github/workflows/release.yml`, `scripts/build-update-manifest.mjs`).
- **Export** (`features/export/`): HTML and PDF share one print-friendly light stylesheet, independent of the app theme, and the same sanitizer and `highlightCodeBlocks` as the preview.
- **Preview** (`features/preview/`): `classifyLink` decides in-app vs external links; external ones open via the `LinkAdapter` (`platform/links/`), never directly.
- **Session** (`features/session/`): open tabs are saved and restored when `files.restorePreviousSession` is on.
- **Settings**: `MarkoraSettings` is shared between `settings-schema.ts` and the Rust settings file (`src-tauri/src/commands/settings.rs`). Adding a setting means updating both, plus `normalizeSettings` and the settings catalog.

## Implementation Guidance

- Use `Result<T, String>` for Rust commands that can fail
- Add tests before changing store logic, Rust commands, or UI behavior
- If a change affects markdown rendering, update tests in `src-tauri/src/commands/markdown.rs` (desktop) and `src/platform/markdown/web.test.ts` (web)
- If a change affects save/open behavior, update `src-tauri/src/commands/file.rs` tests, `src/platform/files/web.test.ts`, and `src/App.tsx`
- Keep Zustand as the source of truth for editor state
- Web-only behavior (persistence, PWA install) is gated by `detectPlatform() === "web"` in `App.tsx`
- Keep Rust command interfaces simple and serializable
- Keep inline comments focused on important concepts, especially around Rust/Tauri integration and editor synchronization
- See `docs/markora-web-capabilities.md` for the full web platform capability reference

## Release Signing

- Windows release builds run from `.github/workflows/release.yml` on tags matching `v*`.
- Tauri updater signing uses the GitHub Actions secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- MSI code signing uses the GitHub Actions secrets `WINDOWS_CERTIFICATE` and `WINDOWS_CERTIFICATE_PASSWORD`.
- `WINDOWS_CERTIFICATE` should contain the base64-encoded contents of a `.pfx` code-signing certificate, not the raw certificate text.
- The release workflow signs built MSI artifacts with `signtool`, applies an RFC 3161 timestamp, verifies the Authenticode signature, and uploads the signed MSI artifact.
- If the Windows certificate changes, update the corresponding GitHub Actions secrets before cutting the next `v*` tag.
