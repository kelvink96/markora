# Settings page redesign

## Intent

The settings page is clunky: about 15 settings are spread over 7 sidebar tabs, most holding one to three rows, each wrapped in a card whose title repeats the tab name. Related settings are split (font size under Appearance, wrap under Editor). Finding anything means clicking through tabs. Goal: make every setting reachable in a glance or a keystroke, with less chrome.

## Goals

- One scrolling page containing all settings, grouped by task.
- Sticky search that filters settings live (label, description, keywords).
- Narrow jump list on the left that scrolls to a section and highlights the current one.
- Less chrome: group headings plus hairline-divided rows, no card per group.
- Better controls: segmented controls for 3-4 options, font size stepper with a live sample.
- "Changed from default" dot per setting; clicking it resets that one setting.
- Reset all, About and privacy link move to the page footer.
- New-document template editor moves into a dialog opened from Files, so the page has no Save button; everything else keeps applying on change.

## Non-goals / anti-goals

- No new settings, no change to `MarkoraSettings` shape or persistence (`settings-schema.ts`, `settings-api.ts`, store untouched).
- No change to desktop/web adapter behaviour.
- Must not lose keyboard/screen-reader access: every control keeps a label tied to it, and search results are announced.
- Keep the theme and colour-scheme swatches (they work well).

## Constraints

- Existing behaviour stays: apply and persist on change; `canRestoreSession` (desktop only) still hides the restore-session row on web.
- Existing UI primitives in `src/components/ui/` (toggle-group, switch, select, dialog, input, kbd) are reused; no new dependency.
- Tests are updated alongside; run per CLAUDE.md (vitest scoped, one heavy command at a time).

## Approaches considered

- **A. One page, declarative setting list, search filters in place (chosen).** Each setting is declared once (id, section, label, description, keywords, control, isChanged, reset). The page renders from the list; search filters it. Biggest refactor, but search, changed-dot and per-setting reset come almost free and new settings are one entry.
- B. Keep tabs, search jumps to the tab. Smallest change, but keeps the tab-hopping complaint and still needs the declarative list.
- C. Search plus flat list, no navigation. Drops browsing.

## Design (as decided)

Layout:

```
┌ Settings ─────────────── [🔍 Search settings…  /] ┐
│ Appearance │  APPEARANCE                          │
│ Writing    │  Theme        [System|Light|Dark]    │
│ Preview    │  Color scheme  ◉Aurora ○Ember ○HC    │
│ Files      │  Status bar                    [on]  │
│            │  WRITING                             │
│            │  Font size   [−] 16 [+]  Aa sample   │
│            │  Line spacing [Compact|Comfy|Relaxed]│
└────────────┴──────────────────────────────────────┘
```

Sections and rows:

- Appearance: theme, colour scheme, status bar.
- Writing: editor font size, line spacing, wrap, line numbers, highlight current line.
- Preview: preview text size, line width, sync scroll, open links externally.
- Files: autosave, restore last session (desktop only), confirm on unsaved close, "Edit new-document template…" button (opens dialog with textarea, Save and Reset template).
- Footer: About (version, privacy link), Reset all settings (existing confirm dialog).

Behaviour:

- Search is a controlled input; `/` focuses it when no text field has focus; Esc clears it. Empty query shows everything. Matching is case-insensitive substring over label, description and keywords. Non-matching rows and empty sections are hidden; the jump list is hidden while searching; zero matches shows a "No settings match" message (live region).
- Jump list click scrolls the section into view; active section tracked with IntersectionObserver.
- Changed dot appears when a value differs from `defaultSettings`; click resets that single setting through the existing `onChange*` handlers.
- Narrow screens: jump list collapses to the top; search stays sticky.

Reuse and removal: `settings-page-shared.tsx` `SectionCard` and the per-section files are replaced by the list-driven page; swatches stay. `settings-navigation.ts` and `SettingsSection` type are reduced to the four jump-list sections. `use-settings-page-state.ts` keeps the system-theme preview logic and gains query/active-section state.

## Left to the builder

- File layout and naming for the setting list and row renderer.
- Exact keywords per setting, visual polish (spacing, sizes, dot styling), and test structure.
- Whether the sample text for font size lives next to the stepper or below it.

## My calls (not discussed with the user)

- `/` as the focus shortcut and Esc to clear.
- Font size becomes a stepper over the existing allowed values (12-24), not free input, so persisted values stay valid.
- Jump list hidden while a query is active.

## Resolved after builder check (my calls, flag if you disagree)

- **Template dialog:** the draft lives in the dialog. Save persists and closes. Reset template puts the default text into the draft only; it persists on Save. Esc/Cancel discards the draft silently. No changed dot for the template.
- **Line spacing:** keep all four existing options (Compact, Comfortable, Relaxed, Spacious) as a segmented control, so a persisted 2.1 stays valid. The mockup's three labels were illustrative.
- **Control choice:** segmented for 2-4 options (theme, line spacing, line width). Select stays for preview text size (5 options).
- **Font size stepper:** steps through the existing list (12, 13, 14, 15, 16, 18, 20, 24); the buttons disable at both ends.
- **Changed dot and reset:** per row. It resets only that row's field(s) to the `defaultSettings` value, comparing primitives per field. Footer "Reset all" is unchanged (settings plus template).
- **Keys:** the settings page replaces the editor view in `App.tsx` and has no Esc handler today, so `/` (only when no text field is focused) and Esc-clears-query don't conflict. Esc with an empty query does nothing new.
- **Footer:** version, privacy link, Reset all. Per-section tests and the navigation test are rewritten for the new structure, not ported one to one.
- **Narrow screens:** below the `md` breakpoint (already used) the jump list becomes a horizontal chip row under the search box.
