import type { EditorState, Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Decoration, type DecorationSet, type WidgetType } from "@codemirror/view";
import type { SyntaxNodeRef } from "@lezer/common";
import { blockHandlers } from "./block-handlers";
import { inlineHandlers } from "./inline-handlers";

/*
 * Live mode decorates the markdown source in place, from the editor's own Lezer syntax tree, and
 * never produces HTML or changes the document. This file is the engine: it walks the tree for the
 * visible ranges and lets per-node handlers say what to do through a small LiveContext.
 *
 * To render another element, add a handler for its Lezer node name (see block-handlers.ts and,
 * inline-handlers.ts for inline elements). Handlers never touch the
 * decoration set directly, so the reveal rule and the visible-range clamping stay in one place.
 */

export interface LiveRange {
  from: number;
  to: number;
}

export interface LiveContext {
  readonly state: EditorState;
  /** True when the cursor or selection touches the line containing `pos`; that line shows raw markdown. */
  isRevealed(pos: number): boolean;
  /** Adds a class to the line containing `pos` (the line stays styled even when it is revealed). */
  lineClass(pos: number, className: string): void;
  /** Calls `visit` for each line from `from` to `to`, limited to the range being decorated. */
  eachLine(from: number, to: number, visit: (line: { from: number; to: number; number: number }) => void): void;
  /** Hides `from..to` unless its line is revealed. */
  hide(from: number, to: number): void;
  /** Styles `from..to` with a class unless its line is revealed. */
  mark(from: number, to: number, className: string, attributes?: Record<string, string>): void;
  /** Draws a widget at `pos` unless its line is revealed. It adds to the text and never replaces it. */
  widget(pos: number, widget: WidgetType): void;
}

/** Return `false` to skip the node's children (used by code blocks, whose content is not markdown). */
export type LiveNodeHandler = (node: SyntaxNodeRef, context: LiveContext) => boolean | void;
export type LiveHandlers = Readonly<Record<string, LiveNodeHandler>>;

/** Every handler Live mode runs. Extend this with further records. */
export const liveHandlers: LiveHandlers = { ...blockHandlers, ...inlineHandlers };

const hiddenDecoration = Decoration.replace({});

export function buildLiveDecorations(
  state: EditorState,
  ranges: readonly LiveRange[],
  handlers: LiveHandlers = liveHandlers,
): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const revealed = revealedSpans(state);
  const isRevealed = (pos: number) => {
    return revealed.some((span) => pos >= span.from && pos <= span.to);
  };
  const lineDecorations = new Map<number, Decoration>();
  const tree = syntaxTree(state);

  for (const range of ranges) {
    const context: LiveContext = {
      state,
      isRevealed,
      lineClass(pos, className) {
        const line = state.doc.lineAt(pos);
        if (line.from < range.from || line.from > range.to) return;
        const existing = lineDecorations.get(line.from);
        const classes = existing ? String(existing.spec.class).split(" ") : [];
        if (classes.includes(className)) return;
        const merged = [...classes, className].join(" ");
        lineDecorations.set(line.from, Decoration.line({ class: merged }));
      },
      eachLine(from, to, visit) {
        let pos = Math.max(from, range.from);
        const end = Math.min(to, range.to);
        while (pos <= end) {
          const line = state.doc.lineAt(pos);
          visit(line);
          pos = line.to + 1;
        }
      },
      hide(from, to) {
        if (to <= from || isRevealed(from)) return;
        decorations.push(hiddenDecoration.range(from, to));
      },
      mark(from, to, className, attributes) {
        if (to <= from || isRevealed(from)) return;
        decorations.push(Decoration.mark({ class: className, attributes }).range(from, to));
      },
      widget(pos, widget) {
        if (isRevealed(pos)) return;
        decorations.push(Decoration.widget({ widget, side: -1 }).range(pos));
      },
    };

    tree.iterate({
      from: range.from,
      to: range.to,
      enter(node) {
        return handlers[node.name]?.(node, context);
      },
    });
  }

  for (const [pos, decoration] of lineDecorations) decorations.push(decoration.range(pos));
  // `true` sorts the ranges, so handlers can add them in any order.
  return Decoration.set(decorations, true);
}

/**
 * The whole-line spans touched by the selection: a multi-line selection reveals every line in it.
 * A selection that ends at column 0 of a line (triple-click, Shift+Down) has not entered that line.
 */
function revealedSpans(state: EditorState): LiveRange[] {
  return state.selection.ranges.map((range) => {
    const endsAtLineStart = !range.empty && range.to === state.doc.lineAt(range.to).from;
    return {
      from: state.doc.lineAt(range.from).from,
      to: state.doc.lineAt(endsAtLineStart ? range.to - 1 : range.to).to,
    };
  });
}
