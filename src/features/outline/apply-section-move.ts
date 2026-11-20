import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { extractHeadings } from "./extract-headings";
import { moveSection, sectionLineRanges } from "./sections";

/**
 * Moves the section of the nth heading to just before the mth (the end of the document for m = the heading
 * count) in the live editor document, as one transaction, so a single undo puts it back. Headings are read
 * from the document itself, never from anything stale. Every selection range follows the text it was on.
 * Returns false, changing nothing, when the move does nothing or makes no sense.
 */
export function applySectionMove(view: EditorView, fromIndex: number, slot: number): boolean {
  const { doc } = view.state;
  const text = doc.toString();
  const headings = extractHeadings(text);
  const move = moveSection(text, headings, fromIndex, slot);
  if (!move) return false;

  // The moved block and the span it jumps over swap places; everything else stays put.
  const { fromLine, toLine } = sectionLineRanges(text, headings)[fromIndex];
  const blockFrom = doc.line(fromLine).from;
  const blockTo = toLine >= doc.lines ? doc.length : doc.line(toLine + 1).from;
  const blockLength = blockTo - blockFrom;
  const movedUp = move.from < blockFrom;
  const spanLength = movedUp ? blockFrom - move.from : move.to - blockTo;

  // Moving the unterminated last line of a document puts a newline between the two parts (and takes the
  // block's own away), so whatever ends up after that newline sits one position further on. In that case the
  // end of the document is part of the moved span too, since the text that ends it changes.
  const unterminated = move.to === doc.length && !text.endsWith("\n");

  const follow = (position: number) => {
    if (position < move.from || position > move.to || (position === move.to && !unterminated)) return position;
    const extra = unterminated ? 1 : 0;
    if (movedUp) return position < blockFrom ? position + blockLength + extra : position - spanLength;
    return position < blockTo ? position + spanLength + extra : position - blockLength;
  };

  const { ranges, mainIndex } = view.state.selection;
  view.dispatch({
    changes: { from: move.from, to: move.to, insert: move.insert },
    selection: EditorSelection.create(
      ranges.map((range) => EditorSelection.range(follow(range.anchor), follow(range.head))),
      mainIndex,
    ),
    userEvent: "move.section",
  });
  return true;
}
