# Views consolidation (Write / Side-by-side / Read)

Size: small change (about 11 files, no new platform code). First of three slices; Focus and Outline board get their own designs afterwards.

## Intent and why

The four views are redundant. Live and Edit are the same CodeMirror pane (Live only adds inline rendering). Preview is Split with the sides swapped and the divider at 32%, not a reading view. The switcher is four unlabeled icons. Result: two real views, and none of them feel worth switching to.

## Goals

- Three views that each mean something different: **Write**, **Side-by-side**, **Read**.
- **Write** merges Live and Edit. Inline rendering is on by default; a **Show syntax** toggle replaces the Edit mode.
- **Read** is a real reading view: preview only, full width, centered column at the existing `preview.contentWidth`, the outline panel available beside it. It replaces today's lopsided Preview.
- **Side-by-side** is today's Split, unchanged in behavior (50/50, draggable divider, optional scroll sync).
- The switcher says what each view is (text labels, not just icons).

## Non-goals / anti-goals

- No change to markdown rendering, adapters, or save/open behavior.
- No new features inside Read (no reading time, no themes). Polish only.
- Must not lose anyone's current mode: an existing Edit user must not wake up in rendered Live.
- Failure even if it "works": a Read view that is just the old Preview at 100% width.

## Approaches considered

1. **Consolidate to three views (chosen, by the user).** Smallest change that removes the redundancy and adds one genuinely new view.
2. Lenses (Focus, Outline board, Present) on top. Kept, but as later slices.
3. Drop named modes for independent panel toggles. Rejected: bigger rework of state, palette and tour, and gives no identity to the views.

## Design

**State** (`workspace-state.ts`): `WorkspaceViewMode = "write" | "split" | "read"`, plus `showSyntax: boolean` with `toggleSyntax`. The toggle only affects Write; in Side-by-side the editor already shows raw markdown beside the preview, and it is hidden in Read.

**Editor** (`editor-pane.tsx`): the live decorations compartment is on when `viewMode === "write" && !showSyntax`.

**Workspace** (`workspace.tsx`): `write` renders the editor only; `split` renders both; `read` renders the preview only, full width, centered. The `preview` special case (swap, 32%) is deleted. Scroll sync stays split-only.

**Read** keeps the editor mounted but hidden, so undo history, cursor and find state survive switching back. Outline selection in Read scrolls the preview (`scrollPreviewToHeading`) instead of `goToLine`. Editor-only toolbar and edit actions are disabled while in Read.

**Persistence** (`view-mode-storage.ts`): keep key `markora:view-mode`; add `markora:show-syntax`. Migration of stored values: `live` becomes write + syntax off, `edit` becomes write + syntax on, `split` stays, `preview` becomes read. Defaults: new installs get write + syntax off; existing installs without a saved mode get write + syntax on (same rule as today's Edit-for-existing-users logic, including `keepEditForPreexistingData`, now setting `showSyntax` instead of switching mode).

**Switcher, palette, footer**: switcher shows icon + label at `md` and up (icon-only below). Palette: "Write View", "Side-by-side View", "Read View", and a "Toggle Syntax" command. Footer shows the new mode name.

**Tests**: update/extend tests for workspace layout, storage migration (all four old values, fresh vs existing install), switcher, palette commands and the editor's live compartment. New tests: Read hides the editor, outline select in Read scrolls the preview.

## Left to the builder

- Icons for the three modes and the Show syntax control's exact placement (top bar vs. only in the View menu and palette).
- Whether the hidden editor needs an explicit CodeMirror re-measure when switching back from Read.
- Tour step copy that mentions view modes (`data-tour="view-mode"`).

## Calls I made (user to confirm)

- Show syntax is a persisted global toggle, not per document.
- Read keeps the editor mounted-but-hidden rather than unmounting it.
- Read does not auto-open the outline; the existing outline toggle controls it.
