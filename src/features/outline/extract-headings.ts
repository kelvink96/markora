export interface Heading {
  /** Position among all headings in the document (0-based); the nth heading in the preview is the same one. */
  index: number;
  /** 1 for "#" up to 6 for "######". */
  level: number;
  /** The heading text with simple markdown (emphasis, code, links) removed. */
  text: string;
  /** 1-based line number in the document. */
  line: number;
}

/** "**Bold** and `code` and [a link](https://x)" becomes "Bold and code and a link". */
function toPlainText(markdown: string) {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|\*|_|~~|`)/g, "")
    .trim();
}

/**
 * Lists the ATX headings ("# Title" ... "###### Title") of a markdown document in order.
 * Lines inside fenced code blocks are skipped, so a "# comment" in a shell snippet isn't a heading.
 */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let fence: string | null = null;

  markdown.split(/\r?\n/).forEach((line, lineIndex) => {
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      return;
    }
    if (fence !== null) return;

    // Up to three spaces of indent are allowed; four or more is a code block.
    const match = /^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line);
    const text = match ? toPlainText(match[2]) : "";
    if (!match || !text) return;

    headings.push({ index: headings.length, level: match[1].length, text, line: lineIndex + 1 });
  });

  return headings;
}

/** The heading the cursor is under: the last one at or above `line`, or -1 before the first. */
export function findActiveHeadingIndex(headings: Heading[], line: number): number {
  let active = -1;
  for (const heading of headings) {
    if (heading.line > line) break;
    active = heading.index;
  }
  return active;
}
