# Outline board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let people drag a heading in the outline sidebar to move its whole section in the document, as one undoable edit, with a keyboard and touch path and a word count per section.

**Architecture:** A pure `moveSection` core computes a single text replacement; `applySectionMove` applies it to the live CodeMirror document as one transaction (so undo is one step); the editor registers it as a `moveSection` command; `OutlinePanel` wraps its rows in dnd-kit (drag only from a dedicated handle) and reports `(fromIndex, slot)` drops that `App.tsx` forwards to the command.

**Tech Stack:** React, Zustand, CodeMirror 6, `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0, `@dnd-kit/utilities` 3.2.2, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-20-outline-board-design.md`. Create the branch `feat/outline-board` from `feat/focus-view`; base the PR on `feat/focus-view` (retarget as #65 and #66 merge).

## Global Constraints

- Dependencies: exactly `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2` (not `@dnd-kit/react`).
- Moves never change a heading's level. Free placement: a section can land under a heading of any level.
- A section = its heading line through the line before the next heading of the same or a shallower level (sub-sections included); the last section runs to the last line. Text before the first heading stays first.
- Handle accessible name: `Move section: <heading text>`. Row word count text: `N words` (`1 word` for one).
- Screen-reader announcements (exact): `Picked up section <title>`; over another row: `<title> is over <other>`; drop up: `Moved <title> before <other>`; drop down: `Moved <title> after <other>`; no valid drop: `Move cancelled`.
- Drag starts only from the handle; clicking, Enter and Space on the row still navigate to the heading.
- Row ids passed to dnd-kit are `String(heading.index)`.
- Tests: one file at a time while working. Node 22 first on PATH (`C:\Users\kelvin\AppData\Local\Author Software\nvm\installs\v22.22.0`). Full suite only as sequential shards `npx vitest run --shard=N/4 --no-file-parallelism`. `tsc` as its own command. Never run heavy commands concurrently. jsdom has no layout, so dnd-kit's real pointer/keyboard movement is verified in the browser (Task 5); component tests drive the handlers dnd-kit receives.

## Review Focus

- A move never loses, duplicates or alters text other than reordering whole sections: property test over every valid move, plus no-trailing-newline, preamble and code-fence documents. Task 1.
- `Ctrl+Z` after a move restores the exact original text in a single step, and the move is computed from the live document, not stale headings. Task 2.
- A plain click or Enter on a row still jumps to the heading, and using the handle never does. Task 3.
- Dropping a section onto itself or its own sub-sections does nothing. Tasks 1 and 3.
- The keyboard path (handle + Space, arrows, Space) and touch activation work in a real browser and don't block scrolling a long outline. Task 5.

---

### Task 1: Section core (pure functions)

**Files:**
- Create: `src/features/outline/sections.ts`
- Test: `src/features/outline/sections.test.ts`

**Interfaces:**
- Consumes: `Heading` and `extractHeadings` from `./extract-headings`; `getWordCount` from `../document/document-actions`.
- Produces:
  - `sectionLineRanges(markdown: string, headings: Heading[]): Array<{ fromLine: number; toLine: number }>` (1-based, inclusive)
  - `sectionWordCounts(markdown: string, headings: Heading[]): number[]`
  - `moveSection(markdown: string, headings: Heading[], fromIndex: number, slot: number): { from: number; to: number; insert: string } | null` (`slot` = heading index the section lands before; `headings.length` = end of document; applying `markdown.slice(0, from) + insert + markdown.slice(to)` gives the result)
  - `slotForDrop(headings: Heading[], fromIndex: number, overIndex: number): number | null`

- [ ] **Step 1: Write the failing tests.** Use these documents (headings from `extractHeadings`) and helper `apply = (md, m) => md.slice(0, m.from) + m.insert + md.slice(m.to)`:
  - `D1 = "# Title\n\n## One\na\n\n## Two\nb\n\n## Three\nc\n"` (Title 0, One 1, Two 2, Three 3)
  - `D2 = "# A\n## A1\n### A1x\n## A2\n# B\n"` (A 0, A1 1, A1x 2, A2 3, B 4)
  - `sectionLineRanges(D1)` is `[{1,11},{3,5},{6,8},{9,11}]`; `sectionLineRanges(D2)` is `[{1,4},{2,3},{3,3},{4,4},{5,6}]`.
  - `sectionWordCounts(D1)` is `[7,2,2,2]` (words in the full section range, heading included, children included).
  - `moveSection` exact results (`apply`): D1 Three(3)→slot 1 gives `"# Title\n\n## Three\nc\n## One\na\n\n## Two\nb\n\n"` and the returned move is exactly `{ from: 9, to: D1.length, insert: "## Three\nc\n## One\na\n\n## Two\nb\n\n" }` (smallest covering range); D1 One(1)→slot 3 gives `"# Title\n\n## Two\nb\n\n## One\na\n\n## Three\nc\n"`; D1 One(1)→slot 4 (end) gives `"# Title\n\n## Two\nb\n\n## Three\nc\n## One\na\n\n"`; D2 A(0)→slot 5 gives `"# B\n# A\n## A1\n### A1x\n## A2\n"` (sub-sections travel); D2 A1(1)→slot 4 gives `"# A\n## A2\n## A1\n### A1x\n# B\n"`; preamble `"intro\n\n# X\nx\n# Y\ny\n"` Y(1)→slot 0 gives `"intro\n\n# Y\ny\n# X\nx\n"`; no trailing newline `"# A\na\n# B\nb"`: B(1)→slot 0 gives `"# B\nb\n# A\na"` and A(0)→slot 2 gives `"# B\nb\n# A\na"`; fenced `"# A\n```\n# not heading\n```\n# B\n"` B(1)→slot 0 gives `"# B\n# A\n```\n# not heading\n```\n"`; CRLF `"# A\r\na\r\n# B\r\nb\r\n"` B(1)→slot 0 gives `"# B\r\nb\r\n# A\r\na\r\n"`.
  - `moveSection` is `null` for: D1 Title(0) with slot 0, 2 and 4 (own start, inside, directly after); D1 One(1) with slot 1 and 2; `fromIndex` -1 and 4; `slot` -1 and 5.
  - **Property:** for every `(fromIndex, slot)` that is not `null` in D1, D2 and the no-trailing-newline document, `apply(...)` has the same length as the original and the same sorted list of lines, and `extractHeadings(result)` has the same set of heading texts and levels.
  - `slotForDrop` on D2's headings: up `(3,1)` is `1`, `(4,0)` is `0`, `(2,0)` is `0`; down `(1,3)` is `4`, `(0,4)` is `5`, `(2,3)` is `4`, `(3,4)` is `5`; `null` for `(1,1)`, `(1,2)` (own sub-section), `(0,2)`, `(0,3)`, and for out-of-range indexes.
- [ ] **Step 2: Run** `npx vitest run src/features/outline/sections.test.ts` — expect FAIL (module missing).
- [ ] **Step 3: Implement** the four exports in `sections.ts`. A heading's section ends at the first later heading with `level <=` its own (or the end); work on `markdown.split("\n")` lines using each heading's 1-based `line`; the blocks keep every byte (a section owns the blank lines after its text); a moved block always ends with `"\n"`, and if the document originally had no trailing newline, strip the final `"\n"` from the new end; return the one replacement covering only the span between the earlier block's start and the later block's end, as character offsets. `slotForDrop`: `overIndex < fromIndex` gives `overIndex`; `overIndex` inside the dragged section (including itself) gives `null`; otherwise the end index of `overIndex`'s section.
- [ ] **Step 4: Run** the test file — expect PASS.
- [ ] **Step 5: Commit** `feat(outline): section moves as a pure core`

### Task 2: Apply a move in the editor

**Files:**
- Create: `src/features/outline/apply-section-move.ts`
- Modify: `src/features/editor/editor-command-state.ts`, `src/components/editor-page/editor-pane/editor-pane.tsx`
- Test: `src/features/outline/apply-section-move.test.ts`, `src/features/editor/editor-command-state.test.ts`, `src/components/editor-page/editor-pane/editor-pane.test.tsx`

**Interfaces:**
- Consumes: `extractHeadings`, `moveSection` (Task 1).
- Produces:
  - `applySectionMove(view: EditorView, fromIndex: number, slot: number): boolean` (re-extracts headings from `view.state.doc.toString()`, dispatches exactly one transaction, returns `false` and leaves the document untouched for a `null` move)
  - Store: `moveSection: (fromIndex: number, slot: number) => void` and `setMoveSection: (handler: (fromIndex: number, slot: number) => void) => void` (default no-op), registered by `EditorPane`.

- [ ] **Step 1: Write the failing tests.** `apply-section-move.test.ts` mounts a real `EditorView` (jsdom, extensions `[history()]`; see `live-extension.test.ts` for mounting) with D1 from Task 1: moving Three(3) to slot 1 gives the same text as `moveSection`'s result and returns `true`; **one `undo(view)` restores `D1` exactly**, `redo` reapplies; a `null` move (e.g. `(1, 1)`) returns `false` and leaves the text and the undo depth unchanged (`undo` then does nothing); computed from the live document: after replacing the document with a different one, the same call moves according to the new headings; selection: with the cursor on the `a` of "## One\na" and One(1) moved to slot 4, the character at the head is still `a` and its line is `a`; with the cursor on the `c` of "## Three" and One moved to slot 4, the head is still on `c`; a cursor before the moved span (inside the preamble) is unchanged. `editor-command-state.test.ts`: `moveSection` is a no-op before registration, and `setMoveSection(handler)` makes `moveSection(1, 3)` call `handler(1, 3)`. `editor-pane.test.tsx` (mock `../../../features/outline/apply-section-move` like the other extension mocks): after render, `moveSection(2, 0)` calls `applySectionMove` once with the view and `(2, 0)`; after unmount it no longer does.
- [ ] **Step 2: Run** the three files — expect FAIL.
- [ ] **Step 3: Implement** `applySectionMove` (one `view.dispatch` with `changes` from `moveSection`; the selection head and anchor map explicitly: positions inside the moved block shift by the distance it moved, positions in the span it jumped over shift by the block's length the other way, positions outside the replaced range stay), the store fields (same shape as `focusEditor`), and an `EditorPane` effect that registers `(from, slot) => viewRef.current && applySectionMove(viewRef.current, from, slot)` and unregisters on cleanup.
- [ ] **Step 4: Run** the three files — expect PASS.
- [ ] **Step 5: Commit** `feat(outline): apply section moves in the editor as one undoable edit`

### Task 3: Drag handles and word counts in the outline panel

**Files:**
- Modify: `package.json`, `package-lock.json` (install the three pinned `@dnd-kit` packages with `npm install --save-exact`), `src/components/editor-page/outline-panel/outline-panel.tsx`
- Test: `src/components/editor-page/outline-panel/outline-panel.test.tsx`

**Interfaces:**
- Consumes: `slotForDrop` (Task 1); word counts come from the caller (Task 4).
- Produces: `OutlinePanel` gains optional props `wordCounts?: number[]` (aligned with `headings`) and `onMoveSection?: (fromIndex: number, slot: number) => void`; existing props unchanged.

- [ ] **Step 1: Write the failing tests** (keep the existing ones passing; they render without the new props, so no handles' absence is asserted). In the test file, wrap `@dnd-kit/core` with `vi.mock("@dnd-kit/core", async (importOriginal) => ...)` so a `DndContext` wrapper records the props it receives (`onDragStart`, `onDragEnd`, `onDragCancel`, `accessibility`) and renders the real one. Cases for headings `"# Title\n\n## Setup\n\n### Install\n\n## Usage\n"` with `onMoveSection`:
  - every row has a button named `Move section: <text>` (`Move section: Setup`, ...), distinct from the row's navigate button; clicking the navigate button calls `onSelect` with that heading; clicking a handle does not call `onSelect`
  - with `wordCounts={[4, 2, 1, 1]}` rows show `4 words`, `2 words`, `1 word`, `1 word`; without `wordCounts` no count text is rendered
  - drop calls: ending a drag of Usage(3) over Setup(1) calls `onMoveSection(3, 1)`; Setup(1) over Usage(3) calls `onMoveSection(1, 4)`; Setup over its own child Install(2), a drop on itself, and a drop with `over: null` call nothing
  - while a drag of Setup(1) is in progress its sub-section row "Install" is not in the list, and it is back after the drag ends or is cancelled
  - announcements (exact strings from Global Constraints): `announcements.onDragStart({ active: { id: "1" } })` is `Picked up section Setup`; `onDragOver` with Usage is `Setup is over Usage`; `onDragEnd` for Usage over Setup is `Moved Usage before Setup`, for Setup over Usage `Moved Setup after Usage`, and with no valid drop `Move cancelled`; `onDragCancel` is `Move cancelled`
  - without `onMoveSection` the panel renders no handles (so the Tour and existing uses are unchanged)
- [ ] **Step 2: Run** `npx vitest run src/components/editor-page/outline-panel/outline-panel.test.tsx` — expect FAIL.
- [ ] **Step 3: Install and implement.** `npm install --save-exact @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2`. In `outline-panel.tsx`: `DndContext` with `PointerSensor`, `TouchSensor` (a short press delay and small tolerance so scrolling the outline still works) and `KeyboardSensor` using `sortableKeyboardCoordinates`; a `SortableContext` over the visible rows' ids with `verticalListSortingStrategy`; each row a sortable item whose grip button (lucide `GripVertical`) carries the dnd-kit `setActivatorNodeRef` and listeners and the accessible name above, beside the unchanged navigate button; `onDragStart` records the dragged id so its sub-section rows (headings after it with a deeper level, until the first with level `<=` its own) are hidden; `onDragEnd` translates `(active, over)` with `slotForDrop` and calls `onMoveSection` only for a non-null slot; a `DragOverlay` showing the title and word count; a visible indicator of the landing slot; announcements as specified. Word count shown small and muted at the row's right edge.
- [ ] **Step 4: Run** the test file and `npx tsc --noEmit` (separately) — expect PASS and no type errors.
- [ ] **Step 5: Commit** `feat(outline): drag handles and word counts in the outline panel`

### Task 4: Wire the board into the app

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `sectionWordCounts` (Task 1), `moveSection` store action (Task 2), `OutlinePanel` props (Task 3).

- [ ] **Step 1: Write the failing tests** in the existing outline `describe` (headings doc `"# Title\n\n## Setup\n\ntext\n\n## Usage\n"` from `withHeadings`): rows show `4 words`, `2 words`, `1 word`; each row has its `Move section:` handle; wrap `@dnd-kit/core` as in Task 3 (in this file's `vi.mock`) to drive a drop: a drop of Usage over Setup calls the store's `moveSection` with `(2, 1)` (set `useEditorCommandState.setState({ moveSection: vi.fn() })` first); the same drop works while `viewMode` is `"read"`; the word counts update when the document content changes.
- [ ] **Step 2: Run** `npx vitest run src/App.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement** in `App.tsx`: `const sectionWords = useMemo(() => sectionWordCounts(content, headings), [content, headings])`; pass `wordCounts={sectionWords}` and `onMoveSection={(from, slot) => useEditorCommandState.getState().moveSection(from, slot)}` to `OutlinePanel` (no gating on the view mode).
- [ ] **Step 4: Run** `src/App.test.tsx` and `npx tsc --noEmit` (separately) — expect PASS and no type errors.
- [ ] **Step 5: Commit** `feat(outline): reorder sections from the outline`

### Task 5: Verify end to end

- [ ] **Step 1:** `npx tsc --noEmit`, then the full frontend suite as 4 sequential shards — expect all PASS. Fix lint and flaky failures in separate commits.
- [ ] **Step 2:** production web build (`npm run build`, then `npx vite preview --port 4173 --strictPort`) and drive it with Playwright on a document with nested headings and a fenced `# comment`: open the outline, drag a handle with the mouse past another section (document and outline both reorder, sub-sections travel), `Ctrl+Z` restores the original in one step, focus a handle and move with Space / arrow keys / Space (and Esc cancels), clicking a row still jumps to its heading, dragging onto its own sub-section changes nothing, a long outline still scrolls with the mouse wheel, and a move works in Read view. Take screenshots. Kill the preview server and close the browser.
- [ ] **Step 3:** open a draft PR (base per the header) with `## Diagram` (Mermaid: drag/keyboard → `slotForDrop` → `moveSection` → one editor transaction → outline re-extracts), `## Video` placeholder, a screenshots section, and a note on the new `@dnd-kit` dependency and why not native drag events (Tauri on Windows).
