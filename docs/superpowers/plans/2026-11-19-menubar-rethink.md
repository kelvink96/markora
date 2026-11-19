# Menu Bar Rethink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make File/Edit/Format/View/Help the complete home for app commands, rendered from the same command registry as the palette, and slim the top-right to the view switcher and theme toggle.

**Architecture:** Extend the existing `PaletteCommand` registry (`src/features/commands/palette-commands.ts`) into an `AppCommand` list with `enabled`/`checked` state, add a pure menu layout of command ids, and have `TopBar` render that layout with the shadcn Menubar primitives. `App.tsx` builds one command context per render and feeds both the menus and the palette.

**Tech Stack:** React, TypeScript, Zustand, Radix/shadcn Menubar, lucide-react, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-19-menubar-rethink-design.md` (its last section, "Corrections found while planning", overrides earlier text).

## Global Constraints

- UI components never call Tauri or browser APIs directly; external links go through the link adapter in `src/platform/links` (`openExternal(url)`; confirm the exact getter name there first).
- Zustand stays the source of truth; settings changes call `updateAppearance`/`updateEditor` then `persistCurrentSettings()`, as `App.tsx` already does.
- Menus show document-dependent items **disabled**; the palette keeps **omitting** them.
- One `label` per command, Title Case menu wording ("Save As", "Find", "Live View"). Palette-only tweaks (hide the active view mode, "Show/Hide Outline" wording) live in `buildPaletteCommands`.
- Zoom steps `editorFontSize` through `[12, 13, 14, 15, 16, 18, 20, 24]` and `previewFontScale` through `[0.9, 1, 1.1, 1.25, 1.5]`; reset restores `16` and `1`.
- Docs URL `https://github.com/kelvink96/markora#readme`; Report an Issue URL `https://github.com/kelvink96/markora/issues/new`.
- Tests before behaviour changes. One heavy command per message. Single test files run directly; prepend `C:\Users\kelvin\AppData\Local\Author Software\nvm\installs\v22.22.0` to PATH for the session. The whole suite runs as `npx vitest run --shard=N/4 --no-file-parallelism`, shards 1 to 4 in separate sequential commands.
- One commit per task; unrelated lint/test fixes go in their own commits.

## Review Focus

- Zoom at the ends of the ranges and with an off-list value: never leaves 12-24 / 0.9-1.5, and Zoom In/Out show disabled at the end (Tasks 1 and 3).
- No document open: every document command is disabled in menus and absent from the palette; opening Edit/Format/View must not throw (Tasks 3 and 5).
- Theme preference "System": the Theme submenu checks System (not the resolved Light/Dark); the header toggle still flips the resolved theme and persists (Tasks 3 and 5).
- Selecting a disabled menu item does nothing; Open Recent with no recents shows a disabled "No recent files" (Task 5).
- Many-item menus stay keyboard-navigable (arrow keys between triggers) and keep touch targets; `touch-targets.test.tsx` still passes (Task 5).

---

### Task 1: Zoom stepping and shared size lists

**Files:**
- Modify: `src/features/settings/settings-schema.ts` (export `EDITOR_FONT_SIZES`, `PREVIEW_SCALES`)
- Modify: `src/components/settings-page/setting-controls.tsx:15,22-28` (import both lists instead of declaring them; keep re-exporting `EDITOR_FONT_SIZES` if other files import it from here; derive preview labels as `` `${Math.round(value * 100)}%` ``)
- Create: `src/features/settings/zoom.ts`
- Test: `src/features/settings/zoom.test.ts`

**Interfaces:**
- Produces: `EDITOR_FONT_SIZES: number[]`, `PREVIEW_SCALES: number[]`.
- Produces: `type ZoomDirection = "in" | "out" | "reset"`; `type ZoomState = Pick<AppearanceSettings, "editorFontSize" | "previewFontScale">`; `stepZoom(state: ZoomState, direction: ZoomDirection): ZoomState`; `canZoom(state: ZoomState, direction: ZoomDirection): boolean`.

- [ ] **Step 1: Write failing tests** in `zoom.test.ts`:
  - `stepZoom({editorFontSize:16,previewFontScale:1},"in")` equals `{editorFontSize:18,previewFontScale:1.1}`; `"out"` gives `{15, 0.9}`.
  - At `{24,1.5}`, `"in"` returns the same state and `canZoom(..,"in")` is `false`; at `{12,0.9}` the same for `"out"`.
  - Off-list `{editorFontSize:17,previewFontScale:1.05}`: `"in"` gives `{18,1.1}`, `"out"` gives `{16,1}`.
  - One axis maxed (`{24,1}`): `"in"` gives `{24,1.1}` and `canZoom("in")` is `true`.
  - `"reset"` gives `{16,1}`; `canZoom({16,1},"reset")` is `false`.
- [ ] **Step 2: Run** `npx vitest run src/features/settings/zoom.test.ts`; expected FAIL (module missing).
- [ ] **Step 3: Move the two lists into `settings-schema.ts`, update `setting-controls.tsx`, implement `zoom.ts`.** Each axis steps independently to the nearest list entry strictly larger/smaller than the current value and stays put at the ends; `reset` uses `defaultSettings.appearance`.
- [ ] **Step 4: Run** the zoom test and `npx vitest run src/components/settings-page`; expected PASS.
- [ ] **Step 5: Commit** `feat(settings): zoom stepping over the allowed size lists`.

### Task 2: Registry becomes AppCommand (palette behaviour preserved)

**Files:**
- Modify: `src/features/commands/palette-commands.ts`, `src/features/commands/palette-commands.test.ts`
- Modify: `src/components/editor-page/command-palette/command-palette.tsx` only if its type import changes

**Interfaces:**
- Produces: `interface AppCommand { id: string; label: string; group: PaletteGroup; shortcut?: string; keywords?: string[]; enabled: boolean; checked?: boolean; run: () => void }`; keep `export type PaletteCommand = AppCommand`.
- Produces: `buildAppCommands(context: PaletteContext): AppCommand[]` returns every command, `enabled: false` for document-only ones when `hasActiveDocument` is false.
- Produces: `buildPaletteCommands(context: PaletteContext): PaletteCommand[]` is `buildAppCommands` filtered to `enabled`, then: drop the `view.mode.*` command whose mode equals `context.viewMode`; label `view.outline` "Hide Outline" when `context.showOutline`, else "Show Outline".
- Labels adopt menu wording: New, Open, Save, Save As, Export as HTML, Export as PDF, Close Tab, Settings (id `app.settings`), Find, Replace (id `edit.replace`), Live View, Edit View, Split View, Preview View, Outline (id `view.outline`, `checked: showOutline`), Toggle Light/Dark Theme (id `view.theme`, palette-only), existing Format labels unchanged. `view.mode.*` carry `checked: mode === viewMode`.
- New Edit commands `edit.undo`, `edit.redo`, `edit.cut`, `edit.copy`, `edit.paste`, `edit.select-all` calling `handlers.onEditAction("undo" | "redo" | "cut" | "copy" | "paste" | "selectAll")`, with shortcuts `Mod+Z`, `Mod+Shift+Z`, `Mod+X`, `Mod+C`, `Mod+V`, `Mod+A`.

- [ ] **Step 1: Update and add tests first** in `palette-commands.test.ts`: adjust existing no-document, with-document, shortcut, view-mode and outline tests to the new labels; add that `buildAppCommands(context({hasActiveDocument:false}))` has `file.save` with `enabled:false` and `file.new` with `enabled:true`; `view.mode.split` is `checked:true` for `viewMode:"split"` while `buildPaletteCommands` omits it; the six Edit ids exist with the shortcuts above.
- [ ] **Step 2: Run** `npx vitest run src/features/commands/palette-commands.test.ts`; expected FAIL.
- [ ] **Step 3: Refactor `palette-commands.ts`** to build the full list in `buildAppCommands` and derive the palette list from it.
- [ ] **Step 4: Run** that file and `npx vitest run src/components/editor-page/command-palette`; expected PASS (fix label assertions in palette component tests if any).
- [ ] **Step 5: Commit** `refactor(commands): one app command list for menus and palette`.

### Task 3: New commands and the context they need

**Files:**
- Modify: `src/features/commands/palette-commands.ts` and its test

**Interfaces:**
- Consumes: `stepZoom`, `canZoom`, `ZoomDirection` (Task 1); `AppearanceSettings`, `EditorSettings`, `ThemePreference`, `ColorScheme` from `settings-schema`.
- Produces: `PaletteContext` gains `appearance: AppearanceSettings` and `editor: EditorSettings`. `PaletteHandlers` gains `onToggleStatusBar()`, `onToggleWordWrap()`, `onToggleLineNumbers()`, `onSetThemePreference(p: ThemePreference)`, `onSetColorScheme(s: ColorScheme)`, `onZoom(d: ZoomDirection)`, `onOpenCommandPalette()`, `onOpenDocs()`, `onReportIssue()`.
- Produces commands: `view.status-bar` "Status Bar" (`checked: appearance.showStatusBar`, document-only); `view.word-wrap` "Word Wrap" and `view.line-numbers` "Line Numbers" (`checked` from `editor`, document-only); `view.theme.system|light|dark` labelled "Theme: System|Light|Dark" (`checked: appearance.theme === value`); `view.color-scheme.standard|sepia|high-contrast` labelled "Color Scheme: Standard|Sepia|High Contrast" (`checked` likewise); `view.zoom-in` "Zoom In", `view.zoom-out` "Zoom Out", `view.zoom-reset` "Reset Zoom" with `enabled: canZoom(appearance, direction)` (not document-dependent); `app.palette` "Command Palette" shortcut `Mod+K`; `help.docs` "Documentation"; `help.report-issue` "Report an Issue". `buildPaletteCommands` also omits `app.palette`.

- [ ] **Step 1: Write failing tests:** preference `system` checks only `view.theme.system`; `view.zoom-in` is `enabled:false` at `{24,1.5}` and `view.zoom-reset` is `enabled:false` at defaults; toggle `checked` values mirror context; `view.zoom-in`'s `run` calls `onZoom("in")`; the palette list omits `app.palette` but `buildAppCommands` keeps it; with no document, status-bar/word-wrap/line-numbers are disabled while zoom, theme and help commands stay enabled.
- [ ] **Step 2: Run** `npx vitest run src/features/commands/palette-commands.test.ts`; expected FAIL.
- [ ] **Step 3: Implement** the commands in `buildAppCommands`; update the test helper `context()` with the new fields.
- [ ] **Step 4: Run** the test file; expected PASS.
- [ ] **Step 5: Commit** `feat(commands): view toggles, theme, zoom and help commands`.

### Task 4: Menu layout

**Files:**
- Create: `src/features/commands/menu-layout.ts`
- Test: `src/features/commands/menu-layout.test.ts`

**Interfaces:**
- Produces: `type MenuNode = { type: "command"; id: string; label?: string } | { type: "separator" } | { type: "submenu"; label: string; items: MenuNode[] } | { type: "recent" }`; `interface MenuDefinition { id: "file" | "edit" | "format" | "view" | "help"; label: string; items: MenuNode[] }`; `MENU_LAYOUT: MenuDefinition[]`; `collectCommandIds(nodes: MenuNode[]): string[]` (recursive).
- Layout (`label` overrides apply inside submenus):
  - File: `file.new`, `file.open`, `recent`, sep, `file.save`, `file.save-as`, submenu "Export" [`file.export-html` "HTML", `file.export-pdf` "PDF"], sep, `file.close`, sep, `app.settings`.
  - Edit: `edit.undo`, `edit.redo`, sep, `edit.cut`, `edit.copy`, `edit.paste`, `edit.select-all`, sep, `edit.find`, `edit.replace`.
  - Format: `format.bold`, `format.italic`, `format.strikethrough`, `format.link`, sep, `format.heading`, submenu "List" [`format.bulletList`, `format.orderedList`, `format.taskList`], `format.quote`, `format.codeBlock`, `format.table`, `format.image`.
  - View: submenu "Mode" [four `view.mode.*`], sep, `view.outline`, `view.status-bar`, sep, submenu "Theme" [`view.theme.system|light|dark` labelled "System", "Light", "Dark"], submenu "Color Scheme" [three, labelled "Standard", "Sepia", "High Contrast"], sep, `view.word-wrap`, `view.line-numbers`, sep, `view.zoom-in`, `view.zoom-out`, `view.zoom-reset`.
  - Help: `app.palette`, `help.shortcuts`, `help.release-notes`, sep, `help.docs`, `help.report-issue`, sep, `help.about`.

- [ ] **Step 1: Write failing tests:** every id from `collectCommandIds(MENU_LAYOUT.flatMap(m => m.items))` exists in `buildAppCommands(<context with a document>)`; no id appears twice; no separator is adjacent to another or first/last in a menu; menu ids in order are file, edit, format, view, help.
- [ ] **Step 2: Run** `npx vitest run src/features/commands/menu-layout.test.ts`; expected FAIL.
- [ ] **Step 3: Implement** `menu-layout.ts` per the layout above.
- [ ] **Step 4: Run** the test file; expected PASS.
- [ ] **Step 5: Commit** `feat(commands): declarative menu layout`.

### Task 5: Render menus from the layout, slim the top-right, wire App

**Files:**
- Modify: `src/components/editor-page/top-bar/top-bar.tsx`, `top-bar.test.tsx`
- Create: `src/components/editor-page/top-bar/command-icons.ts` (`COMMAND_ICONS: Record<string, LucideIcon>`, reusing the icons `top-bar.tsx` imports today; commands with no entry render no icon)
- Modify: `src/App.tsx:156-185` and `:280-310`, plus `src/App.test.tsx`, `src/App.web.test.tsx`, `src/components/ui/touch-targets.test.tsx` where they depend on removed buttons

**Interfaces:**
- Consumes: `AppCommand`, `buildAppCommands`, `buildPaletteCommands` (Tasks 2-3); `MENU_LAYOUT`, `MenuNode` (Task 4).
- Produces: `TopBarProps = { tabs?: ReactNode; commands: AppCommand[]; recentFiles?: Array<{ documentId: string; projectId: string; title: string }>; onOpenRecent?: (projectId: string, documentId: string) => void; onThemeToggle?: () => void; canInstallApp?: boolean; onInstallApp?: () => void; viewMode: WorkspaceViewMode; onViewModeChange: (mode: WorkspaceViewMode) => void }`. Every per-action callback is removed.
- Rendering: a command item shows its label, icon, and `shortcut` in `MenubarShortcut`, with `disabled={!enabled}` and `onSelect={run}`; commands with `checked` render as `MenubarCheckboxItem` (radio items inside the Mode, Theme and Color Scheme submenus); `recent` renders the existing "Open Recent" submenu (disabled "No recent files" when empty); all five menu triggers always show.
- `App.tsx`: build one `commandContext: PaletteContext` per render (`hasActiveDocument`, `viewMode`, `showOutline`, `appearance` and `editor` from `settings`; existing handlers plus `onToggleStatusBar`/`onToggleWordWrap`/`onToggleLineNumbers` (`updateAppearance`/`updateEditor`, then `persistCurrentSettings()`), `onSetThemePreference` (`useThemeStore.getState().setThemePreference(p)`, `updateAppearance({ theme: p })`, persist), `onSetColorScheme`, `onZoom` (`updateAppearance(stepZoom(settings.appearance, d))`, persist), `onOpenCommandPalette`, `onOpenDocs`/`onReportIssue` via the link adapter). Pass `commands={buildAppCommands(commandContext)}` to `TopBar` and `buildPaletteCommands(commandContext)` to the palette while open.
- Top-right keeps only Install app (web), the theme toggle button, and `ViewModeSwitcher` (with a document). The palette, shortcuts, settings and outline buttons are removed; each stays reachable (Ctrl+K and Help; Help; File; View).

- [ ] **Step 1: Rewrite `top-bar.test.tsx` first.** Keep: wordmark only on the empty screen; macOS shortcut labels; arrow-key movement between menus; theme button toggles; view mode switcher; install action only when installable; recent files submenu opens the pick and says "No recent files" when empty. Add: File, Edit, Format, View, Help are all present with no document, and `Save`, `Bold`, `Find` are disabled; selecting a disabled item does not call its handler; Mode shows the active view checked; the Theme submenu checks the item matching `appearance.theme` ("System" when the preference is system, whatever the resolved theme); the `Command palette`, `Keyboard shortcuts`, `Settings` and `Outline` header buttons are gone; Help > Command Palette runs its handler. Build `commands` with `buildAppCommands` and `vi.fn()` handlers.
- [ ] **Step 2: Run** `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`; expected FAIL.
- [ ] **Step 3: Implement** `command-icons.ts`, the recursive menu renderer (split into `menu-renderer.tsx` if `top-bar.tsx` passes ~250 lines), and the `App.tsx` wiring.
- [ ] **Step 4: Run, as separate commands:** the top-bar test, `npx vitest run src/App.test.tsx`, `npx vitest run src/App.web.test.tsx`, `npx vitest run src/components/ui/touch-targets.test.tsx`; point assertions that used removed buttons at the equivalent menu item or shortcut. Expected PASS.
- [ ] **Step 5: Commit** `feat(top-bar): menus rendered from the shared command list`.

### Task 6: Verify end to end

- [ ] **Step 1:** `npx tsc --noEmit`; expected no errors.
- [ ] **Step 2:** Full suite in four sequential shards (`npx vitest run --shard=1/4 --no-file-parallelism` through `4/4`), one per message; expected all pass. Fix failures you caused; pre-existing unrelated ones go in their own commit.
- [ ] **Step 3:** `npm run build`; expected success.
- [ ] **Step 4:** Run `npm run dev`, open each menu with and without a document, try Zoom In/Out in Preview mode and the Theme/Color Scheme checks, screenshot each menu, then stop the dev server and any background processes you started.
- [ ] **Step 5:** Report results with the screenshots. A PR needs before/after screenshots and a `## Diagram` Mermaid block.
