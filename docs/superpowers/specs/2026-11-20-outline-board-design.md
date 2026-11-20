# Outline board (reorder sections from the outline)

Size: one feature, about 10 files plus one new dependency (`@dnd-kit`). Slice 3 of 3 after the views consolidation (#65) and Focus (#66); build on `feat/focus-view`.

## Intent and why

Restructure a long document without cut and paste: drag a heading in the outline and its whole section moves in the document, as one undoable edit. It lives in the existing outline sidebar, not in a fourth view (the views consolidation removed that kind of redundancy).

## Goals

- Every outline row has a **drag handle**. Dragging a row moves its **section** (the heading and everything up to the next heading of the same or a shallower level, so its sub-sections travel with it).
- One drop is one editor transaction, so `Ctrl+Z` undoes a move in a single step.
- Each row shows its section's **word count** in small text.
- Keyboard and touch work: handle focus + Space lifts, arrows move, Space drops, Esc cancels, with screen-reader announcements; touch drags from the handle.
- Works while the editor is hidden (Read view), since the editor stays mounted.

## Non-goals / anti-goals

- Moves never change a heading's level (no promote/demote in this slice). Where a section lands decides its parent.
- Setext headings (`Title` over `====`) are not headings here, as today; headings inside code fences are skipped, as today.
- No board layout, collapse/expand, or cross-document moves.
- Failure even if it "works": a move that loses or duplicates text, breaks `Ctrl+Z`, makes plain clicks on a row stop navigating, or only works with the mouse.

## Approaches considered

1. **Buttons and keys only.** Smallest, accessible, but slow for long jumps and not the board feel.
2. **Native HTML5 drag events.** No dependency, but Tauri's window file-drop handler (not turned off in `tauri.conf.json`) is known to swallow in-page HTML5 drag events on Windows, and touch is poor. Rejected as risky.
3. **dnd-kit (chosen by the user).** Pointer, touch and keyboard sensors, auto-scroll, announcements; pointer events sidestep the Tauri issue. Uses the stable `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0 and `@dnd-kit/utilities` 3.2.2, not the pre-1.0 `@dnd-kit/react`.

## Design

**Pure core** (`src/features/outline/sections.ts`, new), working on the editor's own text (`\n` line breaks):
- `sectionLineRanges(markdown: string, headings: Heading[]): Array<{ fromLine: number; toLine: number }>`: 1-based inclusive lines of each section (the last section runs to the last line).
- `sectionWordCounts(markdown: string, headings: Heading[]): number[]`: words in each section's full range (children included, heading line included), via the existing `getWordCount`.
- `moveSection(markdown: string, headings: Heading[], fromIndex: number, slot: number): { from: number; to: number; insert: string } | null`: `slot` is the heading the section lands **before** (`0` to `headings.length`, where `headings.length` means the end of the document). It returns one replacement over the smallest range that covers both blocks (character offsets in `markdown`), or `null` for a no-op or invalid move (`slot` is the section's own start, directly after its end, or inside it). Text before the first heading stays first. Moved blocks always end with a newline so nothing fuses, and a document with no trailing newline stays without one at its end.
- `slotForDrop(headings: Heading[], fromIndex: number, overIndex: number): number | null`: dragging **up** onto row `j` lands before `j`; dragging **down** onto row `j` lands after `j`'s whole section; dropping on itself or its own sub-sections is `null`.

**Editor command** (`editor-command-state.ts`): `moveSection(fromIndex: number, slot: number): void` plus `setMoveSection`, registered by `EditorPane` like `goToLine`. It re-extracts headings from the live document (never from stale store state), calls `moveSection`, and dispatches one transaction. The selection follows the moved section if it was inside it and otherwise maps through the change; it does not steal focus from the outline.

**UI** (`outline-panel.tsx`): `DndContext` with Pointer (handle only), Touch (short press delay so scrolling still works) and Keyboard sensors, and a `SortableContext` with a vertical list strategy. Row = a grip handle button (accessible name "Move section: <heading>") plus the existing navigate button, so plain clicks, Enter and Space on the row keep navigating. While dragging, the dragged section's sub-section rows are hidden and a `DragOverlay` shows the title and word count; a drop indicator line shows the landing slot. `OutlinePanel` gets `onMoveSection(fromIndex: number, slot: number)`; `App.tsx` passes the command.

**Announcements:** "Picked up section <title>", "<title> is over <other>", "Moved <title> before/after <other>", "Move cancelled".

**Tests:** pure core (sections, counts, every move case below); command state; `EditorPane` registers the command and applies it as one undoable transaction (undo restores the exact original text); `OutlinePanel` (handles exist, clicks still navigate, word counts shown, drop calls `onMoveSection` with the right pair via a mocked dnd context or the keyboard sensor); `App` (moving in Read works; the outline updates after a move).

## Left to the builder

- Handle icon, overlay and indicator styling, touch delay value, announcement wording.
- Whether to mock dnd-kit or drive the keyboard sensor in component tests (prefer the keyboard sensor: it exercises real behavior).
- Exactly how the selection maps for a cursor inside the moved section, within the rule above.

## Calls I made (user to confirm)

- Free placement: a section can land anywhere, including under a heading of a different level; levels never change.
- A section's word count includes its sub-sections.
- Drag starts only from a dedicated handle (so row clicks and keys keep navigating).
- Keyboard moves use dnd-kit's standard keyboard sensor, not separate `Alt+Arrow` shortcuts.
- One new dependency group (`@dnd-kit/*`, stable versions).
