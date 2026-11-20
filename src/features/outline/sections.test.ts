import { describe, expect, it } from "vitest";
import { extractHeadings } from "./extract-headings";
import { moveSection, sectionLineRanges, sectionWordCounts, slotForDrop } from "./sections";

const D1 = "# Title\n\n## One\na\n\n## Two\nb\n\n## Three\nc\n";
const D2 = "# A\n## A1\n### A1x\n## A2\n# B\n";
const NO_NEWLINE = "# A\na\n# B\nb";

type Move = { from: number; to: number; insert: string };
const apply = (markdown: string, move: Move) => markdown.slice(0, move.from) + move.insert + markdown.slice(move.to);

/** The document after moving heading `from` before heading `slot`, or null when the move is refused. */
function moved(markdown: string, from: number, slot: number) {
  const move = moveSection(markdown, extractHeadings(markdown), from, slot);
  return move && apply(markdown, move);
}

describe("sectionLineRanges", () => {
  it("runs each section to the line before the next heading of the same or a shallower level", () => {
    expect(sectionLineRanges(D1, extractHeadings(D1))).toEqual([
      { fromLine: 1, toLine: 11 },
      { fromLine: 3, toLine: 5 },
      { fromLine: 6, toLine: 8 },
      { fromLine: 9, toLine: 11 },
    ]);
  });

  it("includes sub-sections in their parent", () => {
    expect(sectionLineRanges(D2, extractHeadings(D2))).toEqual([
      { fromLine: 1, toLine: 4 },
      { fromLine: 2, toLine: 3 },
      { fromLine: 3, toLine: 3 },
      { fromLine: 4, toLine: 4 },
      { fromLine: 5, toLine: 6 },
    ]);
  });
});

describe("sectionWordCounts", () => {
  it("counts the words in each section's full range, heading and sub-sections included", () => {
    expect(sectionWordCounts(D1, extractHeadings(D1))).toEqual([7, 2, 2, 2]);
  });
});

describe("moveSection", () => {
  it("moves a section up, as the smallest covering replacement", () => {
    const headings = extractHeadings(D1);

    expect(moveSection(D1, headings, 3, 1)).toEqual({
      from: 9,
      to: D1.length,
      insert: "## Three\nc\n## One\na\n\n## Two\nb\n\n",
    });
    expect(moved(D1, 3, 1)).toBe("# Title\n\n## Three\nc\n## One\na\n\n## Two\nb\n\n");
  });

  it("moves a section down", () => {
    expect(moved(D1, 1, 3)).toBe("# Title\n\n## Two\nb\n\n## One\na\n\n## Three\nc\n");
  });

  it("moves a section to the end of the document", () => {
    expect(moved(D1, 1, 4)).toBe("# Title\n\n## Two\nb\n\n## Three\nc\n## One\na\n\n");
  });

  it("takes sub-sections along", () => {
    expect(moved(D2, 0, 5)).toBe("# B\n# A\n## A1\n### A1x\n## A2\n");
    expect(moved(D2, 1, 4)).toBe("# A\n## A2\n## A1\n### A1x\n# B\n");
  });

  it("keeps text before the first heading first", () => {
    expect(moved("intro\n\n# X\nx\n# Y\ny\n", 1, 0)).toBe("intro\n\n# Y\ny\n# X\nx\n");
  });

  it("keeps a document without a trailing newline without one, and never fuses lines", () => {
    expect(moved(NO_NEWLINE, 1, 0)).toBe("# B\nb\n# A\na");
    expect(moved(NO_NEWLINE, 0, 2)).toBe("# B\nb\n# A\na");
  });

  it("leaves a fenced block with its section, and doesn't treat its # lines as headings", () => {
    expect(moved("# A\n```\n# not heading\n```\n# B\n", 1, 0)).toBe("# B\n# A\n```\n# not heading\n```\n");
  });

  it("preserves CRLF line endings byte for byte", () => {
    expect(moved("# A\r\na\r\n# B\r\nb\r\n", 1, 0)).toBe("# B\r\nb\r\n# A\r\na\r\n");
  });

  it("refuses moves that do nothing or make no sense", () => {
    // The whole document is one section: its own start, inside it, and directly after it.
    for (const slot of [0, 2, 4]) expect(moved(D1, 0, slot)).toBeNull();
    for (const slot of [1, 2]) expect(moved(D1, 1, slot)).toBeNull();
    for (const from of [-1, 4]) expect(moved(D1, from, 0)).toBeNull();
    for (const slot of [-1, 5]) expect(moved(D1, 1, slot)).toBeNull();
  });

  it("only ever reorders: every valid move keeps the length, the lines and the headings", () => {
    for (const markdown of [D1, D2, NO_NEWLINE]) {
      const headings = extractHeadings(markdown);
      const lines = (text: string) => text.split("\n").sort();
      const outline = (text: string) =>
        extractHeadings(text)
          .map((heading) => `${heading.level}:${heading.text}`)
          .sort();

      for (let from = 0; from < headings.length; from++) {
        for (let slot = 0; slot <= headings.length; slot++) {
          const result = moved(markdown, from, slot);
          if (result === null) continue;

          expect(result.length, `${from}->${slot}`).toBe(markdown.length);
          expect(lines(result), `${from}->${slot}`).toEqual(lines(markdown));
          expect(outline(result), `${from}->${slot}`).toEqual(outline(markdown));
        }
      }
    }
  });
});

describe("slotForDrop", () => {
  const headings = extractHeadings(D2);

  it("lands before the row it is dragged up onto", () => {
    expect(slotForDrop(headings, 3, 1)).toBe(1);
    expect(slotForDrop(headings, 4, 0)).toBe(0);
    expect(slotForDrop(headings, 2, 0)).toBe(0);
  });

  it("lands after the whole section of the row it is dragged down onto", () => {
    expect(slotForDrop(headings, 1, 3)).toBe(4);
    expect(slotForDrop(headings, 0, 4)).toBe(5);
    expect(slotForDrop(headings, 2, 3)).toBe(4);
    expect(slotForDrop(headings, 3, 4)).toBe(5);
  });

  it("does nothing when dropped on itself or inside its own section", () => {
    expect(slotForDrop(headings, 1, 1)).toBeNull();
    expect(slotForDrop(headings, 1, 2)).toBeNull();
    expect(slotForDrop(headings, 0, 2)).toBeNull();
    expect(slotForDrop(headings, 0, 3)).toBeNull();
  });

  it("does nothing for rows that don't exist", () => {
    expect(slotForDrop(headings, -1, 0)).toBeNull();
    expect(slotForDrop(headings, 0, 9)).toBeNull();
  });
});
