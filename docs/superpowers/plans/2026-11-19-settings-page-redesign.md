# Settings Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the seven-tab settings page with one scrolling page that has sticky search, a jump list, flat grouped rows, per-setting reset and a template dialog.

**Architecture:** A pure `settings-catalog.ts` declares every setting once (id, section, label, description, keywords, `isChanged`, `reset`) and a `filterSettings` function implements search. The page renders rows from the catalog; a `controls` map turns each id into its control. Persistence is unchanged: the page still calls `onChangeAppearance/Editor/Files/Preview` with full section objects.

**Tech Stack:** React, TypeScript, Tailwind, shadcn/radix primitives in `src/components/ui/` (toggle-group, switch, select, dialog, input, kbd), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-19-settings-page-redesign-design.md`

## Global Constraints

- No change to `MarkoraSettings`, `settings-schema.ts`, `settings-api.ts`, the store, or platform adapters.
- Apply-and-persist on every change; the only explicit Save is inside the template dialog.
- `canRestoreSession` false (web) hides the restore-session row everywhere, including search results and the catalog render.
- Line spacing keeps four options: Compact 1.5, Comfortable 1.7, Relaxed 1.9, Spacious 2.1.
- Font sizes step through `[12, 13, 14, 15, 16, 18, 20, 24]`; buttons disable at both ends.
- Segmented controls for 2-4 options (theme, line spacing, line width); select for preview text size (5 options).
- Sections in the jump list: Appearance, Writing, Preview, Files. Footer: version, privacy link (`https://kelvink96.github.io/markora/privacy`), Reset all.
- `/` focuses search only when no text field has focus; Esc clears the query; jump list hidden while the query is non-empty; below `md` the jump list is a chip row under the search box.
- Template dialog: Save persists and closes; Reset template only resets the draft; Esc/Cancel discards the draft.
- Run heavy commands one per message, scoped: `npx vitest run <file>`, then `npx tsc --noEmit`.

## Review Focus

- Whitespace-only query: shows everything, not "no matches".
- Query matching only a desktop-only row on web: shows "No settings match", not a hidden row.
- Persisted value not in an option list (e.g. line spacing 1.6, font size 17): control renders without crashing and nothing is wrongly highlighted; stepper moves to the nearest allowed value.
- `/` typed inside the editor, textarea or an input must not steal focus.
- Esc inside the template dialog closes only the dialog and discards the draft; the page and query stay.

## File Structure

- Create `src/components/settings-page/settings-catalog.ts`: setting definitions, `SettingSection`, `filterSettings`.
- Create `src/components/settings-page/setting-controls.tsx`: `SegmentedControl`, `FontSizeStepper`, and `renderControl`.
- Modify `src/components/settings-page/settings-page-shared.tsx`: replace `SectionCard`/`SidebarButton` with `SettingsGroup` and a `SettingRow` that shows the changed dot.
- Create `src/components/settings-page/template-dialog.tsx`, `settings-footer.tsx`.
- Rewrite `settings-page.tsx`, `settings-sidebar.tsx` (jump list), `use-settings-page-state.ts`; trim `settings-navigation.ts`, `settings-page-types.ts`.
- Delete the per-section files (`appearance-`, `editor-`, `preview-`, `files-`, `about-`, `advanced-`, `template-settings-section.tsx`) and their tests; keep `swatches.tsx`.
- Modify `src/App.tsx`: drop the `onResetTemplate` prop.

---

### Task 1: Setting catalog and search filter

**Files:**
- Create: `src/components/settings-page/settings-catalog.ts`
- Test: `src/components/settings-page/settings-catalog.test.ts`

**Interfaces:**
- Produces:
  - `type SettingSection = "appearance" | "writing" | "preview" | "files"`
  - `interface SettingDefinition { id: string; section: SettingSection; label: string; description?: string; keywords: string[]; desktopOnly?: boolean; isChanged(s: MarkoraSettings): boolean; reset(s: MarkoraSettings): MarkoraSettings }`
  - `SETTING_SECTIONS: Array<{ id: SettingSection; title: string }>`
  - `SETTINGS_CATALOG: SettingDefinition[]` (theme, colorScheme, statusBar, fontSize, lineSpacing, wrap, lineNumbers, activeLine, previewScale, lineWidth, syncScroll, openLinks, autosave, restoreSession (`desktopOnly`), confirmClose, template (no `isChanged`: returns false)).
  - `filterSettings(defs: SettingDefinition[], query: string, opts: { desktop: boolean }): SettingDefinition[]`

- [ ] **Step 1: Write failing tests** in `settings-catalog.test.ts`: `filterSettings(SETTINGS_CATALOG, "  ", {desktop:true})` returns all entries; `"dark"` returns the theme entry; `"AUTOSAVE"` matches case-insensitively; `"zzz"` returns `[]`; `"restore"` with `{desktop:false}` returns `[]` and with `{desktop:true}` returns restoreSession; for `lineSpacing`, `isChanged(createDefaultSettings())` is false, true after `editorLineHeight: 1.9`, and `reset(...)` restores `1.7` without touching other fields; ids are unique.
- [ ] **Step 2: Run** `npx vitest run src/components/settings-page/settings-catalog.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** the catalog. `isChanged`/`reset` compare and write the single field against `defaultSettings`; `filterSettings` trims, lowercases, substring-matches label, description and keywords, and drops `desktopOnly` entries when `desktop` is false (even for an empty query).
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(settings): add setting catalog and search filter`.

### Task 2: Controls and row chrome

**Files:**
- Create: `src/components/settings-page/setting-controls.tsx`
- Modify: `src/components/settings-page/settings-page-shared.tsx`
- Test: `src/components/settings-page/setting-controls.test.tsx`

**Interfaces:**
- Consumes: Task 1 `SettingDefinition`.
- Produces:
  - `SegmentedControl<T extends string | number>({ label, value, options, onChange })`: radix ToggleGroup `type="single"`; ignores the empty deselect event; no option selected when `value` is not in `options`.
  - `FontSizeStepper({ value, onChange })` over `EDITOR_FONT_SIZES`, showing "N px" and an "Aa" sample at that size; `-`/`+` named "Decrease font size"/"Increase font size"; `-` snaps from an off-list value to the nearest lower allowed size, `+` to the nearest higher.
  - `renderControl(id: string, ctx: { settings: MarkoraSettings; previewThemeMode: "light" | "dark"; update: (next: MarkoraSettings) => void }): ReactNode`, covering every catalog id except `template`.
  - `SettingRow({ id, label, description, changed, onReset, children })`: label tied to the control, optional description, and when `changed` a button "Reset <label> to default" that calls `onReset`.
  - `SettingsGroup({ id, title, children })`: an `h3` heading plus divided rows, no card.

- [ ] **Step 1: Write failing tests**: `SegmentedControl` fires `onChange(1.9)` on click and not on re-clicking the selected item; with `value=1.6` renders without a pressed item; `FontSizeStepper` at 24 has `+` disabled, at 12 has `-` disabled, at 17 `+` calls `onChange(18)` and `-` calls `onChange(16)`; `SettingRow` shows the reset button only when `changed` and calls `onReset`.
- [ ] **Step 2: Run** `npx vitest run src/components/settings-page/setting-controls.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** as specified. Theme/colour scheme reuse `SwatchGroup`/`SwatchPreview` from `swatches.tsx` exactly as `appearance-settings-section.tsx` does today (same options, titles, test ids). Preview text size stays a `Select` (copy the option lists from the old files).
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(settings): add segmented control, font stepper and flat row chrome`.

### Task 3: Template dialog and footer

**Files:**
- Create: `src/components/settings-page/template-dialog.tsx`, `src/components/settings-page/settings-footer.tsx`
- Test: `src/components/settings-page/template-dialog.test.tsx`, `src/components/settings-page/settings-footer.test.tsx`

**Interfaces:**
- Produces:
  - `TemplateDialog({ template, onSave }: { template: string; onSave: (value: string) => void })`: renders a button "Edit template…" that opens a dialog holding a textarea (label "Template content") seeded from `template` on each open, with "Save template", "Reset template" and "Cancel".
  - `SettingsFooter({ version, privacyPolicyUrl, onResetAll })`: version text, link "Privacy policy" with that `href`, and the existing "Reset all settings" confirm dialog (copy from `advanced-settings-section.tsx`).

- [ ] **Step 1: Write failing tests**: typing then "Save template" calls `onSave("new text")` and closes; "Reset template" sets the textarea to `defaultNewDocumentTemplate` and does not call `onSave`; pressing Esc after editing closes without `onSave`, and reopening shows the original `template`; footer renders the privacy link `href` and confirming reset calls `onResetAll` once.
- [ ] **Step 2: Run** `npx vitest run src/components/settings-page/template-dialog.test.tsx` (then the footer file in a separate message). Expected: FAIL.
- [ ] **Step 3: Implement** with `Dialog`, `Textarea`, `AlertDialog` from `src/components/ui/`.
- [ ] **Step 4: Run** both files, one per message. Expected: PASS.
- [ ] **Step 5: Commit** `feat(settings): add template dialog and settings footer`.

### Task 4: Assemble the page, search and jump list; remove old tabs

**Files:**
- Rewrite: `settings-page.tsx`, `settings-sidebar.tsx`, `use-settings-page-state.ts`; trim `settings-navigation.ts`, `settings-page-types.ts`
- Delete: the seven `*-settings-section.tsx` files, their tests, `settings-navigation.test.ts` (rewrite for the trimmed list)
- Modify: `src/App.tsx` (remove `onResetTemplate`), `settings-page.test.tsx` (rewrite)
- Test: `src/components/settings-page/settings-page.test.tsx`

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: `SettingsPage` with the existing props minus `onResetTemplate`; `useSettingsPageState` returns `{ query, setQuery, activeSection, previewThemeMode }`; `SettingsSidebar({ activeSection, onClose, onJump })` as a `nav` named "Settings sections" with one button per `SETTING_SECTIONS`, plus "Back to editor".

- [ ] **Step 1: Write failing page tests** (render with `createDefaultSettings()` and `vi.fn()` handlers): all four group headings render with no card per group; typing "dark" in the "Search settings" input leaves only the Theme row and hides the jump list; "zzz" shows "No settings match" (role `status`); whitespace shows everything; with `canRestoreSession` unset, searching "restore" shows "No settings match"; toggling "Show line numbers" calls `onChangeEditor` with `lineNumbers: true`; changing line spacing then rendering with `editorLineHeight: 1.9` shows "Reset Line spacing to default", and clicking it calls `onChangeAppearance` with `editorLineHeight: 1.7`; pressing `/` with focus on `body` focuses search, but not when focus is in an input; Esc in search clears it; "Back to editor" calls `onClose`; clicking a jump-list button calls `scrollIntoView` on that group (mock it).
- [ ] **Step 2: Run** `npx vitest run src/components/settings-page/settings-page.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** `SettingsPage`: sticky header with search `Input` and a `Kbd` hint; groups rendered from `SETTINGS_CATALOG` via `filterSettings` and `renderControl`, with `update` routing to the right `onChange*` by diffing `settings` sections; the template row renders `TemplateDialog`; footer last; active section via `IntersectionObserver` (guard when undefined in jsdom); `/` handler on `window`.
- [ ] **Step 4: Run** the page test file, then (separate messages) `npx vitest run src/components/settings-page`, then `npx tsc --noEmit`. Expected: PASS, no type errors.
- [ ] **Step 5: Run the app** (`npm run dev`), check the page at desktop and narrow width in light and dark, then stop the dev server. Commit `feat(settings): single-page settings with search and jump list`.

## Self-Review Notes

Spec coverage: layout, search, jump list, flat rows, regrouping, segmented controls and stepper (T2), changed dot and per-setting reset (T1/T2/T4), footer and template dialog (T3), narrow chips and keys (T4). Names match across tasks (`SettingDefinition`, `renderControl`, `SettingRow`, `TemplateDialog`, `SettingsFooter`). The PR needs before/after screenshots and a Mermaid diagram per the user's global rules.
