/** The two line endings a text file can use. */
export type LineEnding = "\n" | "\r\n";

/**
 * The line ending a file uses, judged by its first line break. Text with no line break
 * (or an empty file) has nothing to go by and counts as LF.
 */
export function detectLineEnding(text: string): LineEnding {
  const firstBreak = text.indexOf("\n");
  return firstBreak > 0 && text[firstBreak - 1] === "\r" ? "\r\n" : "\n";
}

/** The text as the editor holds it: CodeMirror splits on any line ending and joins with LF. */
export function toLf(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

/** The text with every line break written as `ending`. */
export function applyLineEnding(text: string, ending: LineEnding): string {
  const lf = toLf(text);
  return ending === "\n" ? lf : lf.replace(/\n/g, ending);
}
