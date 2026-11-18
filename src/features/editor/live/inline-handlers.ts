import type { SyntaxNodeRef } from "@lezer/common";
import type { LiveContext, LiveHandlers } from "./live-decorations";

/** Attribute on a rendered link's text carrying its destination, read by the Ctrl/Cmd+click handler. */
export const LIVE_HREF = "data-live-href";

/*
 * Inline elements. Each one is styled with a class on its text and has its markers hidden, both
 * only on lines the cursor is not on (the context applies the reveal rule). Nothing is replaced
 * by a widget: the characters stay in the document, so screen readers and the saved file are
 * unchanged. Inline code and escapes need no special casing for their content: the Lezer tree
 * has no emphasis nodes inside them, so nothing looks there.
 */

/** Styles `from..to` line by line, so a mark wrapping across lines stays styled when only one line is revealed. */
function markLines(
  context: LiveContext,
  from: number,
  to: number,
  className: string,
  attributes?: Record<string, string>,
) {
  context.eachLine(from, to, (line) => {
    context.mark(Math.max(from, line.from), Math.min(to, line.to), className, attributes);
  });
}

/** Hides `from..to` line by line: a replaced range may not contain a line break, and each line reveals on its own. */
function hideLines(context: LiveContext, from: number, to: number) {
  context.eachLine(from, to, (line) => {
    context.hide(Math.max(from, line.from), Math.min(to, line.to));
  });
}

function markNode(
  node: SyntaxNodeRef,
  context: LiveContext,
  className: string,
  attributes?: Record<string, string>,
) {
  markLines(context, node.from, node.to, className, attributes);
}

function hideChildren(node: SyntaxNodeRef, context: LiveContext, markerName: string) {
  for (const marker of node.node.getChildren(markerName)) context.hide(marker.from, marker.to);
}

function styled(className: string, markerName: string) {
  return (node: SyntaxNodeRef, context: LiveContext) => {
    markNode(node, context, className);
    hideChildren(node, context, markerName);
  };
}

const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** The destination as a browser should see it: no angle brackets, backslash escapes and entities decoded. */
export function decodeLinkDestination(raw: string): string {
  const inner = raw.startsWith("<") && raw.endsWith(">") ? raw.slice(1, -1) : raw;
  return inner.replace(/\\([!-/:-@[-`{-~])|&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z]+));/g, (match, escaped, dec, hex, name) => {
    if (escaped) return escaped;
    if (name) return NAMED_ENTITIES[name] ?? match;
    const code = dec ? Number(dec) : parseInt(hex, 16);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

/** `[text](destination "title")`: the text is the link, everything else is hidden. */
function link(node: SyntaxNodeRef, context: LiveContext) {
  const marks = node.node.getChildren("LinkMark");
  const url = node.node.getChild("URL");
  // Reference links (`[text][ref]`) have no destination in place; leave them as written.
  if (marks.length < 4 || !url) return;
  const [open, close] = marks;
  const href = decodeLinkDestination(context.state.sliceDoc(url.from, url.to));
  hideLines(context, open.from, open.to);
  markLines(context, open.to, close.from, "cm-live-link", { [LIVE_HREF]: href });
  hideLines(context, close.from, node.to);
}

export const inlineHandlers: LiveHandlers = {
  StrongEmphasis: styled("cm-live-strong", "EmphasisMark"),
  Emphasis: styled("cm-live-em", "EmphasisMark"),
  Strikethrough: styled("cm-live-strike", "StrikethroughMark"),

  InlineCode: (node, context) => {
    markNode(node, context, "cm-live-code-inline");
    hideChildren(node, context, "CodeMark");
  },

  // Only the backslash goes; the escaped character stays.
  Escape: (node, context) => context.hide(node.from, node.from + 1),

  Link: link,
  Autolink: (node, context) => hideChildren(node, context, "LinkMark"),
  URL: (node, context) => {
    // A link's destination is hidden with the link; any other URL (an autolink or a bare one) is styled.
    const parent = node.node.parent?.name;
    if (parent === "Link" || parent === "Image" || parent === "LinkReference") return;
    markNode(node, context, "cm-live-link", { [LIVE_HREF]: context.state.sliceDoc(node.from, node.to) });
  },
};
