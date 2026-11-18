import type { SyntaxNodeRef } from "@lezer/common";
import type { LiveContext, LiveHandlers } from "./live-decorations";
import { TaskCheckboxWidget } from "./task-checkbox";

/** Hides a block marker such as `#` or `>` together with the single space that follows it. */
function hideMarker(node: SyntaxNodeRef, context: LiveContext) {
  const trailing = context.state.sliceDoc(node.to, node.to + 1) === " " ? 1 : 0;
  context.hide(node.from, node.to + trailing);
}

function heading(node: SyntaxNodeRef, context: LiveContext) {
  const level = Number(node.name.slice(-1));
  context.lineClass(node.from, `cm-live-h${level}`);
}

function fencedCode(node: SyntaxNodeRef, context: LiveContext) {
  const { doc } = context.state;
  const first = doc.lineAt(node.from).number;
  const last = doc.lineAt(node.to).number;
  // An unterminated block has only the opening fence; its last line is still code.
  const closed = node.node.getChildren("CodeMark").length >= 2;

  context.eachLine(node.from, node.to, (line) => {
    context.lineClass(line.from, "cm-live-code");
    if (line.number === first) context.lineClass(line.from, "cm-live-code-start");
    if (line.number === last) context.lineClass(line.from, "cm-live-code-end");
    const isFence = line.number === first || (closed && line.number === last);
    // A fence collapses to a thin edge when the cursor is elsewhere; on it, the raw fence shows.
    if (isFence && !context.isRevealed(line.from)) context.lineClass(line.from, "cm-live-fence");
  });
  // The block's content is code, not markdown: no other handler should look inside it.
  return false;
}

export const blockHandlers: LiveHandlers = {
  ATXHeading1: heading,
  ATXHeading2: heading,
  ATXHeading3: heading,
  ATXHeading4: heading,
  ATXHeading5: heading,
  ATXHeading6: heading,
  SetextHeading1: heading,
  SetextHeading2: heading,
  HeaderMark: (node, context) => {
    if (node.node.parent?.name.startsWith("ATXHeading")) hideMarker(node, context);
    // A setext heading's `===` / `---` underline has no space to take with it.
    else context.hide(node.from, node.to);
  },

  Blockquote: (node, context) => {
    context.eachLine(node.from, node.to, (line) => context.lineClass(line.from, "cm-live-quote"));
  },
  QuoteMark: hideMarker,

  HorizontalRule: (node, context) => {
    context.lineClass(node.from, "cm-live-hr");
    // Keep the dashes in the text (so the document and screen readers are unchanged) but invisible.
    context.mark(node.from, node.to, "cm-live-hr-text");
  },

  ListItem: (node, context) => {
    context.lineClass(node.from, "cm-live-li");
  },
  ListMark: (node, context) => {
    const bullet = node.node.parent?.parent?.name === "BulletList";
    context.mark(node.from, node.to, bullet ? "cm-live-bullet" : "cm-live-number");
  },

  // The `[ ]` / `[x]` text stays; it is only painted transparent, with a real checkbox in front.
  TaskMarker: (node, context) => {
    const checked = /x/i.test(context.state.sliceDoc(node.from, node.to));
    context.mark(node.from, node.to, "cm-live-task-marker");
    context.widget(node.from, new TaskCheckboxWidget(checked));
  },

  FencedCode: fencedCode,
};
