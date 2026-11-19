import { syntaxTree } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { buildLiveDecorations, type LiveHandlers, liveHandlers } from "./live-decorations";
import { LIVE_HREF } from "./inline-handlers";

export interface LiveOptions {
  handlers?: LiveHandlers;
  /** Called with a link's destination when it is Ctrl/Cmd+clicked. Plain clicks never call it. */
  onOpenLink?: (href: string) => void;
}

/**
 * Live mode for the CodeMirror editor: renders markdown elements in place and shows raw markdown
 * on the lines the cursor or selection touches. Add it to the editor only in the Write view with
 * Show syntax off (the editor keeps it in a Compartment). Rendering never changes the document; the
 * only edit Live mode makes is a task checkbox toggle, as an ordinary undoable transaction.
 */
export function liveExtension({ handlers = liveHandlers, onOpenLink }: LiveOptions = {}): Extension {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = decorate(view, handlers);
      }

      update(update: ViewUpdate) {
        // The parse can finish after the viewport first renders, so a new tree also triggers a rebuild.
        if (
          update.docChanged ||
          update.selectionSet ||
          update.viewportChanged ||
          syntaxTree(update.startState) !== syntaxTree(update.state)
        ) {
          this.decorations = decorate(update.view, handlers);
        }
      }
    },
    { decorations: (instance) => instance.decorations },
  );
  return [plugin, linkClicks(onOpenLink), liveTheme];
}

/** The destination of the rendered link under a Ctrl/Cmd press, if any. */
function modifierLink(event: MouseEvent): string | null {
  if (event.button !== 0 || !(event.ctrlKey || event.metaKey) || !(event.target instanceof Element)) return null;
  return event.target.closest(`[${LIVE_HREF}]`)?.getAttribute(LIVE_HREF) ?? null;
}

function linkClicks(onOpenLink?: (href: string) => void): Extension {
  return EditorView.domEventHandlers({
    // Without this, Ctrl/Cmd+click would also add a caret. A plain click is left alone: it places the caret.
    mousedown: (event) => {
      if (!modifierLink(event)) return false;
      event.preventDefault();
      return true;
    },
    click: (event) => {
      const href = modifierLink(event);
      if (!href) return false;
      onOpenLink?.(href);
      return true;
    },
  });
}

function decorate(view: EditorView, handlers: LiveHandlers): DecorationSet {
  // Only what is on screen (plus CodeMirror's margin) is walked, so very large documents stay fast.
  return buildLiveDecorations(view.state, view.visibleRanges, handlers);
}

const liveTheme = EditorView.baseTheme({
  ".cm-live-h1, .cm-live-h2, .cm-live-h3, .cm-live-h4, .cm-live-h5, .cm-live-h6": {
    fontWeight: "700",
    lineHeight: "1.3",
  },
  ".cm-live-h1": { fontSize: "1.9em", paddingTop: "0.3em" },
  ".cm-live-h2": { fontSize: "1.55em", paddingTop: "0.25em" },
  ".cm-live-h3": { fontSize: "1.3em" },
  ".cm-live-h4": { fontSize: "1.15em" },
  ".cm-live-h5, .cm-live-h6": { fontSize: "1em" },

  ".cm-live-quote": {
    borderLeft: "3px solid var(--border)",
    paddingLeft: "0.9em !important",
    color: "var(--muted-foreground)",
  },

  ".cm-live-hr": { borderBottom: "1px solid var(--border)", lineHeight: "0.9" },
  // The dashes stay in the text for the document and screen readers, but are not painted.
  ".cm-live-hr-text, .cm-live-hr-text *": { color: "transparent !important" },

  ".cm-live-li": { paddingLeft: "0.4em !important" },
  ".cm-live-bullet": { color: "transparent", position: "relative" },
  ".cm-live-bullet::before": {
    content: '"\\2022"',
    position: "absolute",
    left: "0",
    color: "var(--syntax-marker)",
  },
  ".cm-live-number": { color: "var(--syntax-marker)" },

  ".cm-live-code": {
    backgroundColor: "color-mix(in oklab, var(--muted) 70%, transparent)",
    paddingLeft: "0.9em !important",
  },
  ".cm-live-code-start": { borderTopLeftRadius: "6px", borderTopRightRadius: "6px" },
  ".cm-live-code-end": { borderBottomLeftRadius: "6px", borderBottomRightRadius: "6px" },
  // An unfocused fence collapses to a thin edge of the code block.
  ".cm-live-fence": { fontSize: "0", height: "0.5rem", overflow: "hidden" },

  ".cm-live-strong": { fontWeight: "700" },
  ".cm-live-em": { fontStyle: "italic" },
  ".cm-live-strike": { textDecoration: "line-through", color: "var(--muted-foreground)" },
  ".cm-live-code-inline": {
    fontSize: "0.92em",
    padding: "0.1em 0.3em",
    borderRadius: "4px",
    backgroundColor: "color-mix(in oklab, var(--muted) 70%, transparent)",
  },
  ".cm-live-link": { color: "var(--primary)", textDecoration: "underline" },
  ".cm-live-task-marker": { color: "transparent", fontSize: "0.01em" },
  ".cm-live-checkbox": { margin: "0 0.45em 0 0", verticalAlign: "middle", cursor: "pointer", accentColor: "var(--primary)" },
});
