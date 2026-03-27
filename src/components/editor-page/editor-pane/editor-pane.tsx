import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView as CMView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { useDocumentStore } from "../../../store/document";

interface EditorPaneProps {
  theme: "light" | "dark";
}

export function EditorPane({ theme }: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the imperative CodeMirror instance in a ref so React re-renders do not recreate it.
  const viewRef = useRef<EditorView | null>(null);
  const { content, setContent } = useDocumentStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = CMView.updateListener.of((update) => {
      if (update.docChanged) {
        // Push user edits from CodeMirror into the Zustand store.
        setContent(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      // Read the latest store value at creation time so the editor boots with current content.
      doc: useDocumentStore.getState().content,
      extensions: [
        basicSetup,
        markdown(),
        updateListener,
        CMView.lineWrapping,
        ...(theme === "dark" ? [oneDark] : []),
      ],
    });

    viewRef.current?.destroy();
    // CodeMirror mounts itself into an existing DOM node instead of returning JSX.
    viewRef.current = new EditorView({ state, parent: containerRef.current });

    return () => {
      viewRef.current?.destroy();
    };
  }, [setContent, theme]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (current !== content) {
      // When external state changes, replace the whole document in the editor.
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  }, [content]);

  return (
    <section className="editor-pane h-full min-h-0 pb-0 pr-0" aria-label="Editor">
      <div className="editor-pane__panel flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--ghost-border)] bg-app-editor shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]">
        <div
          ref={containerRef}
          className="editor-pane__surface min-h-0 flex-1 overflow-hidden bg-app-editor"
          data-testid="editor-surface"
        />
      </div>
    </section>
  );
}
