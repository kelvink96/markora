import { getWordCount } from "../document/document-actions";
import type { Heading } from "./extract-headings";

/** A replacement to apply to a document: `text.slice(0, from) + insert + text.slice(to)`. */
export interface SectionMove {
  from: number;
  to: number;
  insert: string;
}

/**
 * The heading index one past the last heading inside heading `index`'s section: a section runs until
 * the next heading of the same or a shallower level, so deeper headings belong to it.
 */
function sectionEndIndex(headings: Heading[], index: number): number {
  const { level } = headings[index];
  let end = index + 1;
  while (end < headings.length && headings[end].level > level) end++;
  return end;
}

/** The 1-based, inclusive line range of each heading's section; the last one runs to the last line. */
export function sectionLineRanges(markdown: string, headings: Heading[]): Array<{ fromLine: number; toLine: number }> {
  const lineCount = markdown.split("\n").length;

  return headings.map((heading, index) => {
    const end = sectionEndIndex(headings, index);
    return { fromLine: heading.line, toLine: end < headings.length ? headings[end].line - 1 : lineCount };
  });
}

/** Words in each section's full range: its heading line and its sub-sections included. */
export function sectionWordCounts(markdown: string, headings: Heading[]): number[] {
  const lines = markdown.split("\n");

  return sectionLineRanges(markdown, headings).map(({ fromLine, toLine }) =>
    getWordCount(lines.slice(fromLine - 1, toLine).join("\n")),
  );
}

/**
 * Moves the section of heading `fromIndex` so it lands just before heading `slot` (`headings.length` means
 * the end of the document). Returns the one replacement that does it, covering only the span between the
 * two blocks, or `null` when the move would do nothing or make no sense (the section's own start, inside it,
 * directly after it, or an index that doesn't exist). Text before the first heading stays first, no text is
 * added or lost, and a document without a trailing newline stays without one.
 */
export function moveSection(markdown: string, headings: Heading[], fromIndex: number, slot: number): SectionMove | null {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(slot)) return null;
  if (fromIndex < 0 || fromIndex >= headings.length || slot < 0 || slot > headings.length) return null;

  const endIndex = sectionEndIndex(headings, fromIndex);
  if (slot >= fromIndex && slot <= endIndex) return null;

  const lines = markdown.split("\n");
  const offsets: number[] = [0];
  for (const line of lines) offsets.push(offsets[offsets.length - 1] + line.length + 1);
  // The line index where a heading starts; one past the last line is the end of the document.
  const startLine = (index: number) => (index < headings.length ? headings[index].line - 1 : lines.length);
  const offset = (line: number) => (line >= lines.length ? markdown.length : offsets[line]);
  const text = (fromLine: number, toLine: number) => markdown.slice(offset(fromLine), offset(toLine));

  const blockFrom = startLine(fromIndex);
  const blockTo = startLine(endIndex);
  const target = startLine(slot);
  const block = text(blockFrom, blockTo);
  const unterminatedEnd = !markdown.endsWith("\n");

  if (target < blockFrom) {
    // Up: the block goes first, and what it jumped over follows it.
    const between = text(target, blockFrom);
    let insert = (block.endsWith("\n") ? block : `${block}\n`) + between;
    // The block was the unterminated end of the document; what followed it is the new end.
    if (blockTo === lines.length && unterminatedEnd) insert = insert.slice(0, -1);
    return { from: offset(target), to: offset(blockTo), insert };
  }

  // Down: what the block jumps over goes first, and the block follows it.
  const between = text(blockTo, target);
  if (target === lines.length && unterminatedEnd) {
    // The block becomes the unterminated end, so the text before it needs its newline instead.
    return { from: offset(blockFrom), to: offset(target), insert: `${between}\n${block.slice(0, -1)}` };
  }
  return { from: offset(blockFrom), to: offset(target), insert: between + block };
}

/**
 * The heading index the moved section has once `moveSection(fromIndex, slot)` is applied (so the outline can
 * put keyboard focus back on it); where it already is when the move does nothing.
 */
export function movedSectionIndex(headings: Heading[], fromIndex: number, slot: number): number {
  if (fromIndex < 0 || fromIndex >= headings.length) return fromIndex;

  const end = sectionEndIndex(headings, fromIndex);
  if (slot < 0 || slot > headings.length || (slot >= fromIndex && slot <= end)) return fromIndex;
  return slot < fromIndex ? slot : slot - (end - fromIndex);
}

/**
 * Where dropping row `overIndex` onto a dragged row should land the dragged section: before the row when
 * dragging up, after the whole section of the row when dragging down. `null` when the drop does nothing
 * (on itself or inside its own section) or an index doesn't exist.
 */
export function slotForDrop(headings: Heading[], fromIndex: number, overIndex: number): number | null {
  if (fromIndex < 0 || fromIndex >= headings.length || overIndex < 0 || overIndex >= headings.length) return null;
  if (overIndex < fromIndex) return overIndex;
  if (overIndex < sectionEndIndex(headings, fromIndex)) return null;
  return sectionEndIndex(headings, overIndex);
}
