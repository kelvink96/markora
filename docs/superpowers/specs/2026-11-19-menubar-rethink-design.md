# Menu bar rethink: design

## Intent and why
The File/Edit/View/Help menus feel sparse. With no document open, View has a single item ("Toggle Theme"). Several settings (word wrap, line numbers, status bar, zoom) and all markdown formatting are reachable only from Settings or the toolbar, and five top-right icons (palette, shortcuts, settings, theme, outline) duplicate menu items. Make the menus the complete, discoverable home for app commands, and slim the top-right.

## Goals
- Menus cover every common command; nothing important is reachable only from Settings or a hidden shortcut.
- One source of truth for labels, shortcuts, icons, enabled state and checked state, shared by the menubar and the command palette.
- Top-right reduced to the view-mode switcher and theme toggle (plus "Install app" on web when available).
- Same menus on desktop and web.

## Non-goals
- Native OS menus on desktop (Tauri menu API).
- Customisable or user-rebindable shortcuts.
- Redesigning the palette UI or Settings page.

## Anti-goals
- Menus and palette disagreeing on a label or shortcut.
- A command present in the palette but missing from its menu (or vice versa) without an explicit reason.
- Growing `TopBarProps` by one callback per new action.

## Constraints
- Platform rules in CLAUDE.md: UI never calls Tauri/browser APIs directly; Zustand stays the source of truth.
- Existing `PaletteCommand` registry (`src/features/commands/palette-commands.ts`) already has groups File, Edit, Format, View, App, Help, and is built in `App.tsx`.
- Add tests before changing behaviour.

## Approaches considered
1. **Hand-add items to JSX in `top-bar.tsx`.** Smallest change, but labels/shortcuts duplicated with the palette, file grows past 400 lines, every action needs new props.
2. **Drive menus from the palette registry (chosen).** One refactor up front; menus, palette and future shortcut help stay consistent; `top-bar.tsx` becomes layout only.

Chosen: 2, by the user, because the menus will keep growing and a single source prevents drift.

## Design
**Registry.** Extend `PaletteCommand` with optional `icon`, `enabled` (default true) and `checked` (for radio/toggle items). Rename concept to "app command" in comments only; keep the type name to limit churn. Extend `PaletteHandlers`/`PaletteContext` with: sidebar toggle, status bar toggle, word wrap toggle, line numbers toggle, zoom in/out/reset, theme preference setter (system/light/dark), color scheme setter, open docs, report issue.

**Menu definition.** A new menu layout (`src/features/commands/menu-layout.ts`) lists per menu an ordered tree of command ids, separators and submenus. `TopBar` renders it with the existing shadcn Menubar primitives, looking commands up by id. Commands needing an open document render disabled (not hidden) so menus keep a stable shape; this replaces the current hide-when-no-document behaviour.

Layout:
- File: New, Open, Open Recent ▸, | Save, Save As, Export ▸ (HTML, PDF), | Close Tab, | Settings
- Edit: Undo, Redo, | Cut, Copy, Paste, Select All, | Find, Replace
- Format (new): Bold, Italic, Strikethrough, Inline code?, Link, | Heading, List ▸ (bullet, numbered, task), Quote, Code Block, Table, Image
- View: Mode ▸ (Live, Edit, Split, Preview; active item checked), | Sidebar, Outline, Status Bar, | Theme ▸ (System, Light, Dark; checked), Color Scheme ▸, | Word Wrap, Line Numbers, | Zoom In, Zoom Out, Reset Zoom
- Help: Command Palette, Keyboard Shortcuts, Release Notes, | Documentation, Report an Issue, | About Markora

**Palette.** Keeps listing the same registry. Its current "hide the active view mode" and "Hide/Show outline" label swapping stay as palette-side behaviour; menus use checked state instead. New commands (zoom, word wrap, etc.) appear in the palette automatically.

**Zoom.** Zoom in/out/reset steps `appearance.editorFontSize` in the settings store (clamped to the Settings stepper's existing min/max, reset = default 16). No new mechanism.

**Top-right.** Remove command palette, keyboard shortcuts, settings and outline buttons; keep the ViewModeSwitcher and theme toggle. Remove the now-unused `TopBarProps` callbacks that the registry replaces; TopBar receives the command list plus layout state.

## Left to the builder
- Exact shortcuts for new commands (only assign where a real handler exists; otherwise show none).
- Whether "Inline code" exists as a toolbar action today; if not, omit it.
- Docs / Report Issue URLs (use the repo's GitHub; on desktop open via the existing external-link path).
- Sidebar toggle wiring if the sidebar's open state is not yet in a store.
- Touch-target and narrow-screen behaviour of the larger menus (existing `touch-targets.test.tsx` must keep passing).
- Test plan: registry unit tests (checked/enabled, every layout id resolves to a command), TopBar render tests, palette tests unchanged or updated.

## Calls made after the builder check (marked as my calls, not user decisions)
- **Labels:** one `label` per command, using the menu wording ("New", "Open", "Save As", "Find"…). The palette adopts it; existing palette tests are updated. Palette-only behaviour (hiding the active view mode, "Show/Hide outline" swap) stays palette-side. A test asserts every id in the menu layout resolves to a command.
- **Parameterised items:** Theme (System/Light/Dark), Color Scheme (Standard/Sepia/High contrast, from `ColorScheme`) and zoom are generated as one command per option (e.g. `view.theme.dark`), so they also appear in the palette. Open Recent is a dynamic layout node, menu-only (the palette has Open file); that is the one deliberate exception to menu/palette parity.
- **Heading:** a single "Heading" item mapped to the existing `heading` toolbar action, as in the toolbar. No H1–H6 submenu, so no toolbar-action API change.
- **Theme toggle:** keeps `toggleTheme` (flips the resolved theme, also when the preference is System). The palette's "Toggle light/dark theme" stays.
- **Disabled vs hidden:** menus show document-dependent items disabled; the palette keeps filtering them out. Undo, Redo, Cut, Copy, Paste and Select All are added to the palette Edit group for parity.
- **External links:** Documentation and Report an Issue use the existing `platform/links` `openExternal`.
- **Sidebar:** I found no sidebar open-state store. If it is local component state, lift it into the workspace store with tests.
- **Install app** stays a prop on `TopBar`. Before removing the palette/shortcuts/settings/outline icons, confirm each remains reachable by key or menu (palette via Ctrl+K, Shortcuts via Help, Settings via File, Outline via View).
- **Zoom (my call, user did not pick):** Zoom In/Out/Reset step `appearance.editorFontSize` and `appearance.previewFontScale` together, so they work in every view mode. This replaces the "editor font size only" line under Zoom above.

## Corrections found while planning (these override the sections above)
- There is no separate sidebar: the only side panel is the outline. Drop the "Sidebar" View item; "Outline" is the toggle.
- There is no inline-code toolbar action; omit it from Format.
- Commands carry no icon field (the registry stays UI-free). Icons are an id-to-icon map next to the menu renderer.
- A menu layout item may override a command label inside its submenu (for example "Theme: Dark" in the palette shows as "Dark" under View > Theme).
- Zoom steps through the existing allowed lists (editor font sizes 12 to 24, preview scales 0.9 to 1.5), not arbitrary increments.
- **Hidden menus (user request, after merge):** a top-level menu where every command is disabled is not rendered. With no document open that hides Edit and Format; File, View and Help stay. Items inside a visible menu are still shown disabled.
