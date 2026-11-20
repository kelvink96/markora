# Focus (hide everything and write)

Size: small change (about 10 files, no platform code). Slice 2 of 3 after the views consolidation (PR #65, which this builds on); Outline board is slice 3.

## Intent and why

A quick drafting session: press one key, everything but the text disappears, write, press a key (or Esc) and it all comes back. It is a toggle on Write, not a fourth view, because it only makes sense while writing and a fourth view would bring back the redundancy the consolidation removed. It must feel like nothing to enter and nothing to configure.

## Goals

- **Focus** toggle: hides the top bar (menus, tabs, view switcher), the formatting bar, the status bar and the outline, and centers the editor at the existing preview content width (`preview.contentWidth`).
- **Dimming:** every paragraph except the one with the cursor fades. A setting turns it off.
- One keystroke in and out: `Ctrl/Cmd+Shift+F` toggles, `Esc` exits. Also reachable from View > Focus and the command palette.
- Entering shows a brief hint ("Focus on. Esc to exit") so the missing chrome never feels like a bug.

## Non-goals / anti-goals

- No typewriter scrolling, word-goal ring, chrome fade-on-typing, or true fullscreen (the C option; revisit later if wanted).
- Not persisted: the app always opens normally.
- No new Tour stop.
- Failure even if it "works": a Focus a user can't get out of, or Esc stealing the key from the find bar, menus or dialogs.

## Approaches considered

1. **Chrome only (A).** Cheapest, but the writing surface doesn't change; Focus would just be "menus hidden".
2. **Chrome + paragraph dimming (A+, chosen by the user).** Covers "hide everything and write" and gives Focus its own look.
3. **Full mock (C):** A+ plus typewriter scroll, goal ring, fade-on-typing, fullscreen. Rejected as too much for a quick toggle; fullscreen alone needs a Tauri window permission plus a separate browser path.

## Design

**State** (`workspace-state.ts`): `focusMode: boolean` (default `false`, not persisted), `toggleFocus()`, `setFocusMode(on)`. `setViewMode` to anything other than `"write"` also turns Focus off, so Focus can only ever be on in Write.

**Shell** (`App.tsx` / `AppShell`): while `focusMode`, pass `null` for `header`, `toolbar` and `statusBar`, and don't render the outline sidebar. `AppShell` itself needs no new props. The editor pane gets a centering wrapper constrained to the width map `PreviewPane` already uses (export that map rather than duplicating it).

**Dimming** (`src/features/editor/focus/focus-dimming.ts`, new): a CodeMirror `ViewPlugin`, built like the Live extension and held in its own Compartment in `EditorPane`. The current paragraph is the maximal run of non-blank lines containing the cursor (the selection head); every other visible line gets a line decoration `cm-focus-dim` (opacity about 0.35, a short transition that is disabled under `prefers-reduced-motion`). On a blank line nothing is current, so everything dims until typing starts a paragraph. Only visible ranges are decorated (large documents stay fast). It works the same with Live rendering on or off. `EditorPane` gets a `focusDim?: boolean` prop (on when `focusMode && settings.editor.focusDimming`).

**Setting:** `editor.focusDimming: boolean`, default `true`, in the schema, defaults, sanitizing and the settings catalog (Writing section, label "Dim other paragraphs in Focus"), following how `highlightActiveLine` is handled.

**Commands:** `view.focus` ("Focus", group View, `checked: focusMode`, enabled only with a document in Write; shortcut `Ctrl/Cmd+Shift+F`) in `palette-commands.ts`, placed in the View menu next to Show Syntax; `PaletteContext.focusMode` and `PaletteHandlers.onToggleFocus`. The shortcut is registered with the other app shortcuts in `App.tsx`.

**Esc:** exits Focus only when nothing else wants the key: the keydown has not been default-prevented and no dialog, menu, find bar or palette is open. Find bar, palette and dialogs keep closing on Esc first; a second Esc exits Focus.

**Hint:** a toast via the existing sonner setup when Focus turns on.

**Tests:** state (toggle, leaving Write exits Focus, not persisted); dimming extension (current paragraph found for cursor mid-paragraph, on a boundary, on a blank line, at document start and end; decorations follow the cursor and edits; off when `focusDim` is false); `EditorPane` compartment toggling without rebuilding the editor; palette (`view.focus` enabled/checked rules, handler); menu layout; settings schema and catalog for `focusDimming`; App level (shortcut toggles Focus; chrome slots disappear and return; Esc exits; Esc with the find bar open closes only the find bar; switching view exits).

## Left to the builder

- The exact dim opacity and transition timing.
- Hint wording and duration.
- Whether `Ctrl/Cmd+Shift+F` collides with anything in the Tauri webview or browsers; if it does, pick the nearest free chord and say so in the PR.
- How "nothing else wants Esc" is detected (default-prevented plus open-dialog checks).

## Calls I made (user to confirm)

- Not persisted across launches.
- Switching to Side-by-side or Read exits Focus.
- Dimming is a setting, on by default.
- Nothing visible tells you the document is unsaved while Focus is on (Ctrl+S still works); acceptable for a quick session.
