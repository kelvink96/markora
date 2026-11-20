# Views consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four views (Live, Edit, Split, Preview) with three (Write, Side-by-side, Read) plus a persisted **Show syntax** toggle that replaces Edit.

**Architecture:** `WorkspaceViewMode` becomes `"write" | "split" | "read"`; a separate `showSyntax: boolean` lives in the same Zustand store and storage module. `EditorPane` takes a plain `live` boolean instead of a mode. Read reuses `PreviewPane` full width (its CSS already centers the column from `--preview-measure`) and parks the editor mounted but hidden.

**Tech Stack:** React, Zustand, CodeMirror 6, Vitest + Testing Library, Tauri (no Rust changes).

**Spec:** `docs/superpowers/specs/2026-11-19-views-consolidation-design.md` (mockup the user approved: `C:\Users\kelvin\.claude\jobs\e69b44f6\tmp\markora-views.html`).

## Global Constraints

- Modes are exactly `"write" | "split" | "read"`; UI labels are **Write**, **Side-by-side**, **Read**; the toggle is labeled **Show syntax**.
- localStorage keys: keep `markora:view-mode` (now holds the new names); add `markora:show-syntax` (`"1"` / `"0"`).
- Legacy migration: `live`→write + syntax off, `edit`→write + syntax on, `split`→split, `preview`→read. Fresh install: write + syntax off. Existing install with no saved mode: write + syntax on.
- Show syntax only affects Write. It is one global setting, not per document.
- Read keeps the editor mounted but hidden; Read does not auto-open the outline.
- No change to markdown rendering, platform adapters or Rust.
- Run tests one file at a time while working. Full-suite runs follow the repo rule: Node v22 first on PATH (`C:\Users\kelvin\AppData\Local\Author Software\nvm\installs\v22.22.0`), then `npx vitest run --shard=N/4 --no-file-parallelism`, shards sequentially, one heavy command per message.
- `npx tsc --noEmit` is **expected red from Task 1 until Task 5** (the type change ripples). Don't "fix" it by widening types; each task only gates on its own test files.

## Review Focus

- Existing desktop user whose older data is only found after launch (`keepEditForPreexistingData`): must end in Write + syntax on, and stay there on the next launch. Test in Task 1.
- Read must not allow invisible edits: format and edit commands are disabled in Read. Test in Task 4.
- Outline click in Read scrolls the preview and does not touch the hidden editor. Test in Task 5.
- Show syntax choice survives Write → Side-by-side/Read → Write. Test in Task 1.
- Blocked or garbage storage never crashes and lands on Write. Test in Task 1.

---

### Task 1: Storage and store

**Files:**
- Modify: `src/features/workspace/view-mode-storage.ts`, `src/features/workspace/workspace-state.ts`
- Test: `src/features/workspace/view-mode-storage.test.ts`, `src/features/workspace/workspace-state.test.ts`

**Interfaces:**
- Produces:
  - `type WorkspaceViewMode = "write" | "split" | "read"` (exported from `workspace-state.ts`)
  - `interface ViewState { viewMode: WorkspaceViewMode; showSyntax: boolean }` and `loadViewState(): ViewState` (replaces `loadViewMode`)
  - `saveViewMode(mode: WorkspaceViewMode): void`, `saveShowSyntax(on: boolean): void` (both clear the `markora:view-mode-default` marker)
  - `keepEditForPreexistingData(): boolean` (true when it switched syntax on)
  - Store: `viewMode`, `setViewMode`, `showSyntax`, `setShowSyntax(on: boolean)`, `toggleSyntax()`, `keepEditForPreexistingData()`; existing outline fields unchanged.

- [ ] **Step 1: Rewrite `view-mode-storage.test.ts`** to cover, each as its own `it`, with `localStorage.clear()` in `beforeEach`:
  - fresh install: `loadViewState()` toEqual `{ viewMode: "write", showSyntax: false }`
  - existing install (`markora:session` or `markora:web-settings` present, nothing stored): `{ viewMode: "write", showSyntax: true }`
  - legacy values: stored `live` → `{write,false}`, `edit` → `{write,true}`, `split` → `{split, <unchanged>}`, `preview` → `{read, <unchanged>}`; after loading, `localStorage.getItem("markora:view-mode")` is the new name and `markora:show-syntax` is set for live/edit
  - saved new values round-trip via `saveViewMode("read")` + `saveShowSyntax(true)`
  - unknown stored mode (`"sideways"`) falls back by the install rule
  - blocked storage (spy `Storage.prototype.getItem/setItem` to throw): `loadViewState()` is `{write,false}` and both save functions don't throw
  - default is remembered: after a fresh load, adding `markora:session` doesn't flip syntax on at next load
  - `keepEditForPreexistingData`: returns true and sets syntax on after a launch that only defaulted; returns false once the user called `saveViewMode` or `saveShowSyntax`; returns false on a launch that restored stored values
- [ ] **Step 2: Run** `npx vitest run src/features/workspace/view-mode-storage.test.ts` — expect FAIL (`loadViewState` undefined).
- [ ] **Step 3: Implement** the interface above in `view-mode-storage.ts`, keeping the existing default-marker mechanism (`markora:view-mode-default`, `defaultedThisLaunch`). Legacy names are accepted only on read and rewritten to the new names. `show-syntax` for `split`/`preview` legacy values falls back to the install rule's value.
- [ ] **Step 4: Update `workspace-state.test.ts`**: initial state is write/off with the outline closed; `setViewMode("read")` persists `markora:view-mode`; `toggleSyntax()` flips and persists `markora:show-syntax`; **syntax choice survives**: `toggleSyntax()`, `setViewMode("split")`, `setViewMode("write")` → `showSyntax` still true; the three launch cases (fresh, existing, last-used) via the existing `freshStore()` helper; outline tests unchanged.
- [ ] **Step 5: Implement** the store changes in `workspace-state.ts` (initial values from `loadViewState()`).
- [ ] **Step 6: Run** both test files — expect PASS.
- [ ] **Step 7: Commit** `feat(views): three view modes and a persisted Show syntax setting`

### Task 2: Workspace layout and editor live flag

**Files:**
- Modify: `src/components/editor-page/workspace/workspace.tsx`, `src/components/editor-page/editor-pane/editor-pane.tsx`
- Test: `src/components/editor-page/workspace/workspace.test.tsx`, `src/components/editor-page/editor-pane/editor-pane.test.tsx`

**Interfaces:**
- Consumes: `WorkspaceViewMode` from Task 1.
- Produces: `Workspace` props unchanged (`viewMode`, `sidebar`, `left`, `right`) with the new mode type. `EditorPane` prop `viewMode?: WorkspaceViewMode` is replaced by `live?: boolean` (default `false`); live decorations are on iff `live`.

- [ ] **Step 1: Update `workspace.test.tsx`** (`renderPanes` now takes `"write" | "split" | "read"`):
  - `write`: renders `left` only, no preview, no divider
  - `split`: unchanged assertions (50% width, divider keys, sidebar tests, scroll sync)
  - `read`: the `right` pane is visible in a region labeled `Reader workspace` with no width style (full width); `left` is still in the DOM but inside an element with the `hidden` attribute and `aria-hidden="true"`; no `separator` role exists
  - scroll sync links the panes in `split` only: in `write` and `read`, scrolling does not move the other scroller
- [ ] **Step 2: Update `editor-pane.test.tsx`** where it passes `viewMode="live"`/other: use `live` / omit. Add: toggling the `live` prop reconfigures decorations without recreating the editor (document text and selection unchanged).
- [ ] **Step 3: Run** both files — expect FAIL.
- [ ] **Step 4: Implement `Workspace`**: `write` → editor only (today's live/edit branch); `split` → today's split branch minus all `preview` swapping and the 32% effect; `read` → sidebar + `<section role="region" aria-label="Reader workspace" className="min-h-0 flex-1 overflow-hidden">{right}</section>` plus `<div hidden aria-hidden="true">{left}</div>`. `useScrollSync` enabled only for `split`.
- [ ] **Step 5: Implement `EditorPane`**: rename the prop; `liveMode = live`. Leave the compartment logic as is.
- [ ] **Step 6: Run** both files — expect PASS. Then check by eye (Task 6) that CodeMirror re-measures after returning from Read; if not, call `view.requestMeasure()` when `live`/mode changes back (builder's call, covered by a test only if added).
- [ ] **Step 7: Commit** `feat(views): Read layout and editor live flag`

### Task 3: Switcher and Show syntax toggle

**Files:**
- Modify: `src/components/editor-page/view-mode-switcher/view-mode-switcher.tsx`, `src/components/editor-page/top-bar/top-bar.tsx`
- Create: `src/components/editor-page/view-mode-switcher/syntax-toggle.tsx` (export `SyntaxToggle`), re-export from `index.ts`
- Test: `view-mode-switcher.test.tsx`, `top-bar.test.tsx`, new `syntax-toggle.test.tsx` in the same folder

**Interfaces:**
- Produces: `SyntaxToggle({ checked: boolean; onCheckedChange: (on: boolean) => void })` rendering a control with `role="switch"`, accessible name `Show syntax`. `TopBar` gains props `showSyntax: boolean`, `onShowSyntaxChange: (on: boolean) => void`; it renders `SyntaxToggle` next to the switcher only when `viewMode === "write"` (unmounted otherwise, my call).

- [ ] **Step 1: Tests.** Switcher: three items with aria-labels `Write view`, `Side-by-side view`, `Read view`; each shows its text label (class hides the text below `md`, assert the label text is in the DOM); clicking the selected item does not clear selection; `onValueChange` receives `"write"`, `"split"`, `"read"`. SyntaxToggle: `aria-checked` reflects `checked`; click calls `onCheckedChange(!checked)`. TopBar: toggle present in write, absent in split and read.
- [ ] **Step 2: Run** the three files — expect FAIL.
- [ ] **Step 3: Implement.** Icons from lucide: `PencilLine` (write), `Columns2` or the existing `PanelsTopLeft` (split), `BookOpen` (read). Keep `data-tour="view-mode"` on the group. Use an existing `@/components/ui` switch if the repo has one, otherwise a `Toggle` styled as a switch.
- [ ] **Step 4: Run** the three files — expect PASS.
- [ ] **Step 5: Commit** `feat(views): labeled view switcher and Show syntax toggle`

### Task 4: Commands, menu, footer, tour copy

**Files:**
- Modify: `src/features/commands/palette-commands.ts`, `src/features/commands/menu-layout.ts`, `src/components/editor-page/footer-status-bar/footer-status-bar.tsx`, `src/features/tour/tour-state.ts`
- Test: `palette-commands.test.ts`, `menu-layout.test.ts`, `footer-status-bar.test.tsx`, `tour-state.test.ts`

**Interfaces:**
- Consumes: Task 1 types.
- Produces: `PaletteContext` gains `showSyntax: boolean`; `PaletteHandlers` gains `onToggleSyntax: () => void`. Command ids: `view.mode.write` ("Write View"), `view.mode.split` ("Side-by-side View"), `view.mode.read` ("Read View"), `view.syntax` ("Show Syntax", `checked: showSyntax`, enabled only with a document and `viewMode === "write"`). Old ids `view.mode.live|edit|preview` are removed.

- [ ] **Step 1: Tests.**
  - palette: the three mode commands with the labels above, `checked` follows `viewMode`, `run` calls `onViewModeChange` with the mode; `view.syntax` checked/enabled rules; **`edit.*` and `format.*` commands are disabled when `viewMode === "read"`** and enabled in write/split (with a document); `file.*` commands unaffected
  - menu-layout: View → Mode submenu lists the three mode ids, followed by `view.syntax`; update any "every command id is placed" assertions
  - footer: shows `Write`, `Side-by-side` or `Read`; the `Ln x, Col y` text is absent in `read`
  - tour: the `view-mode` stop's content matches the new text
- [ ] **Step 2: Run** the four files — expect FAIL.
- [ ] **Step 3: Implement.** Mode keywords: write `["live","hybrid","wysiwyg","rendered","edit"]`, split `["side by side","live preview"]`, read `["preview","reading","rendered"]`. Tour copy: "Write renders as you type (turn on Show syntax to see raw markdown), Side-by-side shows both, and Read shows just the result." Footer maps mode to its label instead of the capitalized raw value.
- [ ] **Step 4: Run** the four files — expect PASS.
- [ ] **Step 5: Commit** `feat(views): commands, menu, footer and tour for the new views`

### Task 5: App wiring

**Files:**
- Modify: `src/App.tsx`, `src/app/hooks/use-web-lifecycle.ts` (only if its call to `keepEditForPreexistingData` needs the new store action name; the store action keeps its name)
- Test: `src/App.test.tsx`, `src/App.web.test.tsx`, `src/app/hooks/use-web-lifecycle.test.ts`

**Interfaces:**
- Consumes: store (`viewMode`, `showSyntax`, `setShowSyntax`, `toggleSyntax`), `TopBar` props, `PaletteContext.showSyntax`, `PaletteHandlers.onToggleSyntax`, `EditorPane live`.

- [ ] **Step 1: Tests (App level).**
  - default render shows the Write view; the switcher has three labeled items
  - choosing Read hides the editor (`hidden` ancestor) and shows the preview full width; choosing Write again shows the editor with the same text
  - **outline in Read:** open the outline, switch to Read, click a heading → `scrollPreviewToHeading` called with `(heading.index, headings.length)` and `goToLine` not called (mock both as the current tests do)
  - outline in Write behaves as before (`goToLine` called)
  - Show syntax toggle: visible in Write, turns live decorations off (assert via the `live` prop reaching `EditorPane`, or the existing live-extension DOM marker), hidden in Read
  - fix every old `Live`/`Edit`/`Preview` expectation in `App.test.tsx`, `App.web.test.tsx` and `use-web-lifecycle.test.ts`
- [ ] **Step 2: Run** `npx vitest run src/App.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement** in `App.tsx`: read `showSyntax`/`toggleSyntax` from the store; `EditorPane live={viewMode === "write" && !showSyntax}`; pass `showSyntax`/`onShowSyntaxChange` to `TopBar`; add `showSyntax` and `onToggleSyntax` to `commandContext`; in the outline `onSelect`, `if (viewMode !== "read") goToLine(heading.line)`, and call `scrollPreviewToHeading` when `viewMode === "read" || !settings.preview.syncScroll`; Read does not auto-open the outline.
- [ ] **Step 4: Run** `src/App.test.tsx`, `src/App.web.test.tsx`, `src/app/hooks/use-web-lifecycle.test.ts` one at a time — expect PASS.
- [ ] **Step 5: Commit** `feat(views): wire Write, Side-by-side and Read into the app`

### Task 6: Verify end to end

- [ ] **Step 1:** `npx tsc --noEmit` — expect no errors. Fix any leftover references to `"live"`, `"edit"`, `"preview"` view modes (`rg '"live"|"edit"|"preview"' src` and judge each hit; settings `preview` section names are unrelated).
- [ ] **Step 2:** full frontend suite, shards `1/4` to `4/4` one per message (see Global Constraints) — expect all PASS. Fix lint and flaky failures you hit in separate commits.
- [ ] **Step 3:** Run the app (`/run`, production build per global rules) and walk through: Write with syntax off/on, Side-by-side, Read with the outline, switch back and forth (undo history and cursor survive; text still renders correctly after returning from Read). Capture before/after screenshots of the top bar and Read.
- [ ] **Step 4:** Open a draft PR. Body must include `## Diagram` (Mermaid: old four modes → new three + syntax toggle, with the migration mapping) and `## Video` (placeholder). Clean up dev servers.
