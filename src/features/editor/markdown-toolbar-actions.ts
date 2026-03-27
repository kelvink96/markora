export type MarkdownToolbarAction =
  | "heading"
  | "bold"
  | "italic"
  | "strike"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "quote"
  | "codeBlock"
  | "link"
  | "table"
  | "image";

export interface MarkdownEditResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

function wrapSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix = prefix,
  placeholder = "text",
): MarkdownEditResult {
  const selected = text.slice(selectionStart, selectionEnd) || placeholder;
  const replacement = `${prefix}${selected}${suffix}`;
  const nextText = `${text.slice(0, selectionStart)}${replacement}${text.slice(selectionEnd)}`;
  const contentStart = selectionStart + prefix.length;

  return {
    text: nextText,
    selectionStart: contentStart,
    selectionEnd: contentStart + selected.length,
  };
}

function prefixSelectedLines(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefixFactory: (index: number) => string,
): MarkdownEditResult {
  const lineStart = text.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const lineEndIndex = text.indexOf("\n", selectionEnd);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const prefixed = lines.map((line, index) => `${prefixFactory(index)}${line || ""}`).join("\n");
  const nextText = `${text.slice(0, lineStart)}${prefixed}${text.slice(lineEnd)}`;

  return {
    text: nextText,
    selectionStart: lineStart,
    selectionEnd: lineStart + prefixed.length,
  };
}

export function applyMarkdownToolbarAction(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  action: MarkdownToolbarAction,
): MarkdownEditResult {
  switch (action) {
    case "heading":
      return prefixSelectedLines(text, selectionStart, selectionEnd, () => "# ");
    case "bold":
      return wrapSelection(text, selectionStart, selectionEnd, "**");
    case "italic":
      return wrapSelection(text, selectionStart, selectionEnd, "*");
    case "strike":
      return wrapSelection(text, selectionStart, selectionEnd, "~~");
    case "bulletList":
      return prefixSelectedLines(text, selectionStart, selectionEnd, () => "- ");
    case "orderedList":
      return prefixSelectedLines(text, selectionStart, selectionEnd, (index) => `${index + 1}. `);
    case "taskList":
      return prefixSelectedLines(text, selectionStart, selectionEnd, () => "- [ ] ");
    case "quote":
      return prefixSelectedLines(text, selectionStart, selectionEnd, () => "> ");
    case "codeBlock":
      return wrapSelection(text, selectionStart, selectionEnd, "```md\n", "\n```", "code");
    case "link":
      return wrapSelection(text, selectionStart, selectionEnd, "[", "](https://)", "label");
    case "image": {
      const altText = text.slice(selectionStart, selectionEnd) || "alt text";
      const snippet = `![${altText}](path/to/image.png)`;
      const nextText = `${text.slice(0, selectionStart)}${snippet}${text.slice(selectionEnd)}`;
      const pathStart = selectionStart + `![${altText}](`.length;

      return {
        text: nextText,
        selectionStart: pathStart,
        selectionEnd: pathStart + "path/to/image.png".length,
      };
    }
    case "table": {
      const snippet = "| Column | Value |\n| --- | --- |\n| Item | Detail |";
      const nextText = `${text.slice(0, selectionStart)}${snippet}${text.slice(selectionEnd)}`;
      return {
        text: nextText,
        selectionStart,
        selectionEnd: selectionStart + snippet.length,
      };
    }
  }
}
