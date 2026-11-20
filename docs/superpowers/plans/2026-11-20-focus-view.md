# Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Focus toggle on the Write view that hides all chrome, centers the editor, and dims every paragraph except the one with the cursor.

**Architecture:** `focusMode` is a non-persisted flag in the workspace store (only ever true in Write). `App.tsx` blanks the header, toolbar, status bar and outline while it is active and centers the editor in an always-present wrapper (so toggling never remounts the editor). Dimming is a new CodeMirror extension in its own compartment, driven by a persisted `editor.focusDimming` setting that needs a matching Rust field.

**Tech Stack:** React, Zustand, CodeMirror 6, sonner, Vitest + Testing Library; Rust (serde) for the settings file.

**Spec:** `docs/superpowers/specs/2026-11-20-focus-view-design.md`. **Builds on PR #65** (views consolidation): create the branch `feat/focus-view` from `feat/views-consolidation`, and base the PR on that branch (or on `main` once #65 is merged).

## Global Constraints

- Setting: `editor.focusDimming: boolean`, default `true`, label **"Dim other paragraphs in Focus"** (Writing section of Settings).
- Command id `view.focus`, label **"Focus"**, group View, `checked: focusMode`, shortcut `Ctrl/Cmd+Shift+F`, enabled only with a document open and `viewMode === "write"`.
- Dimmed lines carry the class `cm-focus-dim` (opacity about 0.35; transition disabled under `prefers-reduced-motion`).
- Hint when Focus turns on: toast text **"Focus on. Esc to exit."**
- `focusMode` is not persisted. Any `setViewMode` to a mode other than `"write"` turns it off.
- Esc exits Focus only if the keydown was not default-prevented (find bar, slash menu, dialogs and menus already prevent it).
- The editor wrapper must be rendered identically with Focus on and off (only its inline `maxWidth` changes), otherwise React remounts the editor.
- Tests: one file at a time while working. Node 22 first on PATH (`C:\Users\kelvin\AppData\Local\Author Software\nvm\installs\v22.22.0`). Full suite only as sequential shards: `npx vitest run --shard=N/4 --no-file-parallelism`. Rust: `cd src-tauri && cargo test settings` as its own command. Never run heavy commands concurrently.

## Review Focus

- Esc with the find bar, slash menu, palette or a dialog open closes that widget and leaves Focus on. Test in Task 5.
- Entering and leaving Focus never remounts the editor (undo history, cursor). Test in Task 5.
- Closing the last document, or opening Settings, while in Focus brings the chrome back (no trapped user). Test in Task 5.
- Dimming edge cases: cursor on a blank line, at document start and end, selection spanning paragraphs, `\r\n` line endings. Tests in Task 2.
- A desktop settings file written before this change (no `focusDimming`) loads with dimming on, and a saved `false` survives a round trip. Rust tests in Task 1.

---

### Task 1: The `focusDimming` setting (TypeScript and Rust)

**Files:**
- Modify: `src/features/settings/settings-schema.ts` (type `EditorSettings`, `defaultSettings.editor`), `src/components/settings-page/settings-catalog.ts`, `src/components/settings-page/setting-controls.tsx`, `src-tauri/src/commands/settings.rs`
- Test: `src/features/settings/settings-schema.test.ts`, `src/components/settings-page/settings-page.test.tsx` (and the catalog test if one exists), Rust tests in `settings.rs`

**Interfaces:**
- Produces: `MarkoraSettings.editor.focusDimming: boolean`; Rust `EditorSettings.focus_dimming: bool` (`camelCase` on the wire, `#[serde(default = "default_focus_dimming")]` returning `true`).

- [ ] **Step 1: Write the failing tests.** TS: `defaultSettings.editor.focusDimming` is `true`; `normalizeSettings({ editor: { focusDimming: false } }).editor.focusDimming` is `false`; `normalizeSettings({ editor: { focusDimming: "no" } })` and `normalizeSettings({})` give `true`. Settings page: a switch labelled "Dim other paragraphs in Focus" in the Writing section reflects the setting, and toggling it updates the store; it is findable by searching "focus" or "dim". Rust: `legacy_settings_file_without_focus_dimming_dims_by_default` (a file whose `editor` has only `wordWrap`, `lineNumbers`, `highlightActiveLine` loads with `focus_dimming == true`, modeled on `legacy_settings_file_without_updates_checks_automatically`); `focus_dimming_opt_out_round_trips_and_reset_restores_it` (save with `false`, load returns `false`, `reset_settings_in_dir` returns `true`).
- [ ] **Step 2: Run** `npx vitest run src/features/settings/settings-schema.test.ts` and `npx vitest run src/components/settings-page/settings-page.test.tsx`, then `cd src-tauri && cargo test settings` — expect FAIL (field missing).
- [ ] **Step 3: Implement** the field in `settings-schema.ts` (default `true`; `normalizeSettings` already merges known keys with `mergeKnown`, so only the type and default change), the catalog entry `field("editor", "focusDimming", { id: "focusDimming", section: "writing", label: "Dim other paragraphs in Focus", keywords: ["focus", "dim", "fade", "paragraph", "distraction"] })`, and the switch in `setting-controls.tsx` next to the `highlightActiveLine` switch; add `focus_dimming` with the serde default to the Rust `EditorSettings`, its `Default`/`default_settings()` value, and the JSON fixture at the bottom of the file.
- [ ] **Step 4: Run** the same TS commands and `cargo test settings` — expect PASS.
- [ ] **Step 5: Commit** `feat(focus): focusDimming setting, in the schema and the Rust settings file`

### Task 2: Dimming extension

**Files:**
- Create: `src/features/editor/focus/focus-dimming.ts`
- Test: `src/features/editor/focus/focus-dimming.test.ts`

**Interfaces:**
- Produces:
  - `currentParagraphLines(state: EditorState): { fromLine: number; toLine: number } | null` (1-based, inclusive; the maximal run of non-blank lines around the selection head; `null` when the head is on a blank line; a blank line is empty or whitespace-only)
  - `buildFocusDecorations(state: EditorState, ranges: readonly { from: number; to: number }[]): DecorationSet` (a `Decoration.line({ class: "cm-focus-dim" })` on every line in `ranges` outside the current paragraph; every line when the paragraph is `null`)
  - `focusDimming(): Extension` (a `ViewPlugin` that rebuilds from `view.visibleRanges` on `docChanged`, `selectionSet` and `viewportChanged`, plus a base theme for `.cm-focus-dim`)

- [ ] **Step 1: Write the failing tests** (build states with `EditorState.create({ doc, selection })`). `currentParagraphLines`: cursor mid-paragraph in `"a\nb\n\nc\nd"` at line 2 gives `{1,2}`; cursor at position 0 gives `{1,2}`; cursor at document end gives `{4,5}`; cursor on the blank line 3 gives `null`; a whitespace-only line counts as blank; a one-line document gives `{1,1}`; a selection spanning two paragraphs uses its head; `"a\r\nb\r\n\r\nc"` behaves like the `\n` version. `buildFocusDecorations`: collect decorated line numbers with `decorations.between`/`iter`: for the same document with the cursor in paragraph 2 only paragraphs 1's lines are dimmed; with `null` all lines are; only lines inside `ranges` are touched; an empty document produces none. `focusDimming()` mounted in a real `EditorView` (jsdom): moving the selection moves the `cm-focus-dim` class between lines, and typing a newline pair splits the paragraph accordingly.
- [ ] **Step 2: Run** `npx vitest run src/features/editor/focus/focus-dimming.test.ts` — expect FAIL (module missing).
- [ ] **Step 3: Implement** the three exports; follow `src/features/editor/live/live-extension.ts` for the plugin shape. The base theme sets `opacity: "0.35"` and a short opacity transition, with `transition: none` inside `@media (prefers-reduced-motion: reduce)`.
- [ ] **Step 4: Run** the test file — expect PASS.
- [ ] **Step 5: Commit** `feat(focus): paragraph dimming extension`

### Task 3: `EditorPane` dimming flag

**Files:**
- Modify: `src/components/editor-page/editor-pane/editor-pane.tsx`
- Test: `src/components/editor-page/editor-pane/editor-pane.test.tsx`

**Interfaces:**
- Consumes: `focusDimming()` from Task 2.
- Produces: `EditorPane` prop `focusDim?: boolean` (default `false`).

- [ ] **Step 1: Write the failing tests**, mirroring the two `live` tests: mock `../../../features/editor/focus/focus-dimming` like `live-extension` is mocked; "turns paragraph dimming on and off with the focusDim flag, without rebuilding the editor" (rerender false → true dispatches `{ effects: { reconfigured: <extension> } }`, back to false reconfigures to `[]`, `EditorState.create` called once); "boots dimmed when it opens with focusDim"; "is not dimmed when no focusDim flag is given".
- [ ] **Step 2: Run** `npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement** a second `Compartment` (`focusCompartment`) beside `liveCompartment`, wired exactly like it (initial value from the first render's prop via a ref, a reconfigure effect when the prop changes).
- [ ] **Step 4: Run** the test file — expect PASS.
- [ ] **Step 5: Commit** `feat(focus): EditorPane dimming flag`

### Task 4: Focus state, command and menu entry

**Files:**
- Modify: `src/features/workspace/workspace-state.ts`, `src/features/commands/palette-commands.ts`, `src/features/commands/menu-layout.ts`
- Test: `workspace-state.test.ts`, `palette-commands.test.ts`, `menu-layout.test.ts`; also add `focusMode: false` and `onToggleFocus: vi.fn()` to the context/handler fixtures in `palette-commands.test.ts`, `menu-layout.test.ts` and `top-bar.test.tsx`

**Interfaces:**
- Produces:
  - Store: `focusMode: boolean` (initially `false`, never written to storage), `setFocusMode(on: boolean): void`, `toggleFocus(): void`; `setViewMode(mode)` also sets `focusMode: false` when `mode !== "write"`.
  - `PaletteContext.focusMode: boolean`; `PaletteHandlers.onToggleFocus: () => void`; command `view.focus` as in Global Constraints (keywords `["distraction", "zen", "hide", "full screen", "dim"]`), placed in the View menu right after `view.syntax`.

- [ ] **Step 1: Write the failing tests.** Store: starts `false`; `toggleFocus` flips it; `setViewMode("split")` and `setViewMode("read")` turn it off, `setViewMode("write")` leaves it; it is not in `localStorage` after toggling (no key contains "focus"); a fresh store import starts `false` even if it was on. Palette: `view.focus` label "Focus", `checked` follows `focusMode`, enabled only in Write with a document (disabled in split, read and with no document), `run` calls `onToggleFocus`, shortcut is `Ctrl+Shift+F` (and `Cmd+Shift+F` with `modifier: "Cmd"`). Menu: `view.focus` is listed once, directly after `view.syntax`; the "only refers to commands that exist" and "lists each command once" tests still pass.
- [ ] **Step 2: Run** the three test files — expect FAIL.
- [ ] **Step 3: Implement** the store fields, the command (same `{ ...withDocument(...), enabled, checked }` shape as `view.syntax`) and the menu node.
- [ ] **Step 4: Run** the three files plus `src/components/editor-page/top-bar/top-bar.test.tsx` — expect PASS.
- [ ] **Step 5: Commit** `feat(focus): focus state, command and menu entry`

### Task 5: App wiring: chrome, centering, shortcut, Esc, hint

**Files:**
- Create: `src/features/preview/content-width.ts` exporting `CONTENT_WIDTH_MEASURE` (moved out of `preview-pane.tsx`, which imports it)
- Modify: `src/App.tsx`, `src/app/hooks/use-keyboard-shortcuts.ts`, `src/components/editor-page/preview-pane/preview-pane.tsx`
- Test: `src/App.test.tsx`, `src/app/hooks/use-keyboard-shortcuts.test.ts`

**Interfaces:**
- Consumes: `focusMode`, `toggleFocus`, `setFocusMode` (Task 4); `EditorPane focusDim` (Task 3); `settings.editor.focusDimming` (Task 1).
- Produces: `useKeyboardShortcuts` option `onToggleFocus?: () => void`, fired on `Ctrl/Cmd+Shift+F` (case-insensitive key `f`, `preventDefault` called).

- [ ] **Step 1: Write the failing tests.** Shortcut hook: `Ctrl+Shift+F` and `Meta+Shift+F` call `onToggleFocus`; plain `Ctrl+F` does not. App tests (extend the existing mocks: the `EditorPane` mock also records mounts with a `useEffect` counter, the `TopBar`, `FormattingBar` and `FooterStatusBar` mocks already render recognizable text):
  - toggling Focus (palette "Focus" or `Ctrl+Shift+F`) removes "Top Bar", "Formatting Bar" and "Footer Status", and the outline panel even when `showOutline` is true; toggling again restores them, and the outline comes back open
  - the toast "Focus on. Esc to exit." is shown on entering only (mock `sonner`'s `toast` the way other App tests do)
  - **the editor is not remounted** by entering and leaving Focus (mount counter stays 1)
  - the editor wrapper gets `maxWidth` from the content-width setting while focused (narrow `60ch`, normal `72ch`, wide `90ch`) and none otherwise
  - `EditorPane` receives `focusDim` only while focused and `settings.editor.focusDimming` is true
  - `Esc` exits Focus; **`Esc` does not exit when something earlier prevented it** (register a capturing `keydown` listener that calls `preventDefault()` on Escape, then fire Escape and expect Focus still on); a second, unprevented Esc exits
  - **no trapped user:** with Focus on, closing the only document (or opening Settings via the palette) shows the chrome/empty state again
  - switching to Read through the palette turns Focus off
- [ ] **Step 2: Run** `npx vitest run src/app/hooks/use-keyboard-shortcuts.test.ts` and `npx vitest run src/App.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement.** In `App.tsx`: `const focusActive = focusMode && viewMode === "write" && hasOpenDocuments && activeScreen === "workspace"` (derived, so the chrome returns whenever Focus can't apply); pass `null` for `header`, `toolbar` and `statusBar` and `undefined` for the outline `sidebar` when `focusActive` (`showOutline` itself is untouched); wrap `<EditorPane>` in an always-rendered `<div className="mx-auto h-full w-full" style={focusActive ? { maxWidth: CONTENT_WIDTH_MEASURE[settings.preview.contentWidth] } : undefined}>`; `focusDim={focusActive && settings.editor.focusDimming}`; a `handleToggleFocus` that calls `toggleFocus()` and, when turning on, `toast("Focus on. Esc to exit.")`, passed as `onToggleFocus` to both `useKeyboardShortcuts` and the palette handlers, plus `focusMode` in `commandContext`; an effect (only while `focusActive`) adding a `document` `keydown` listener that calls `setFocusMode(false)` for `Escape` when `!event.defaultPrevented` (the same pattern as `tour-runner.tsx`). In `use-keyboard-shortcuts.ts` add the `Ctrl/Cmd+Shift+F` branch and extend the doc comment. Add `src/features/preview/content-width.ts` and import it in `preview-pane.tsx`.
- [ ] **Step 4: Run** both test files, then `src/components/editor-page/preview-pane/preview-pane.test.tsx` and `npx tsc --noEmit` — expect PASS and no type errors.
- [ ] **Step 5: Commit** `feat(focus): hide the chrome, center the editor and wire the shortcut`

### Task 6: Verify end to end

- [ ] **Step 1:** `npx tsc --noEmit`, then `cd src-tauri && cargo test` (separate commands) — expect clean and all passing.
- [ ] **Step 2:** the full frontend suite in 4 sequential shards (see Global Constraints) — expect all PASS. Fix lint and flaky failures you hit in separate commits.
- [ ] **Step 3:** run a production web build (`npm run build`, then `npx vite preview`) and drive it with Playwright: enter Focus with the shortcut, type across paragraphs and watch the dimming follow the cursor, press Ctrl+F then Esc (find bar closes, Focus stays), press Esc again (Focus exits), toggle the setting off and confirm no dimming, and check Write → Focus → palette "Read View" exits Focus. Take before/after screenshots. Kill the preview server and close the browser.
- [ ] **Step 4:** open a draft PR (base per the header) with `## Diagram` (Mermaid: Focus on/off state flow including the exits: Esc, shortcut, leaving Write, no document), `## Video` placeholder, and the screenshots section. Note in the PR that the spec's "no platform code" gained a Rust settings field.
