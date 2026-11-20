import { type EditorState, type Extension, RangeSetBuilder } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";

const dimLine = Decoration.line({ class: "cm-focus-dim" });

const isBlank = (text: string) => text.trim() === "";

/**
 * The paragraph the cursor is in: the run of non-blank lines around the selection head, as 1-based
 * inclusive line numbers. A blank line belongs to no paragraph, so the result is `null` there.
 */
export function currentParagraphLines(state: EditorState): { fromLine: number; toLine: number } | null {
  const { doc } = state;
  const head = doc.lineAt(state.selection.main.head);
  if (isBlank(head.text)) return null;

  let fromLine = head.number;
  while (fromLine > 1 && !isBlank(doc.line(fromLine - 1).text)) fromLine--;
  let toLine = head.number;
  while (toLine < doc.lines && !isBlank(doc.line(toLine + 1).text)) toLine++;
  return { fromLine, toLine };
}

/**
 * A dim decoration on every non-blank line inside `ranges` that is outside the current paragraph
 * (every non-blank line while the cursor is on a blank one). Blank lines have nothing to fade.
 */
export function buildFocusDecorations(
  state: EditorState,
  ranges: readonly { from: number; to: number }[],
): DecorationSet {
  const { doc } = state;
  const current = currentParagraphLines(state);
  const builder = new RangeSetBuilder<Decoration>();
  let lastDimmed = -1;

  for (const { from, to } of ranges) {
    let line = doc.lineAt(from);
    while (line.from <= to) {
      const inCurrent = current !== null && line.number >= current.fromLine && line.number <= current.toLine;
      // Adjacent ranges can share a line; the builder needs strictly increasing positions.
      if (!inCurrent && !isBlank(line.text) && line.from > lastDimmed) {
        builder.add(line.from, line.from, dimLine);
        lastDimmed = line.from;
      }
      if (line.number >= doc.lines) break;
      line = doc.line(line.number + 1);
    }
  }
  return builder.finish();
}

const focusTheme = EditorView.baseTheme({
  ".cm-focus-dim": { opacity: "0.35", transition: "opacity 150ms ease" },
  "@media (prefers-reduced-motion: reduce)": { ".cm-focus-dim": { transition: "none" } },
});

/** Fades every paragraph except the one with the cursor. It only decorates; it never edits the document. */
export function focusDimming(): Extension {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildFocusDecorations(view.state, view.visibleRanges);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildFocusDecorations(update.view.state, update.view.visibleRanges);
        }
      }
    },
    { decorations: (instance) => instance.decorations },
  );
  return [plugin, focusTheme];
}
