import { syntaxTree } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { buildLiveDecorations, type LiveHandlers, liveHandlers } from "./live-decorations";

/**
 * Live mode for the CodeMirror editor: renders markdown elements in place and shows raw markdown
 * on the lines the cursor or selection touches. Add it to the editor only while the view mode is
 * "live" (the editor keeps it in a Compartment). Purely visual: the document is never changed.
 */
export function liveExtension(handlers: LiveHandlers = liveHandlers): Extension {
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
  return [plugin, liveTheme];
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
  ".cm-live-hr-text": { color: "transparent" },

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
});
