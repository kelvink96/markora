import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/*
 * Markora's editor look. Every colour is a CSS variable from the active theme, so the editor
 * follows the scheme (Aurora / Ember / High contrast) and light/dark mode with no rebuild.
 */

const markdownHighlight = HighlightStyle.define([
  { tag: t.heading, color: "var(--syntax-heading)", fontWeight: "700" },
  { tag: t.strong, color: "var(--foreground)", fontWeight: "700" },
  { tag: t.emphasis, color: "var(--syntax-emphasis)", fontStyle: "italic" },
  { tag: t.strikethrough, color: "var(--muted-foreground)", textDecoration: "line-through" },
  { tag: t.link, color: "var(--syntax-link)" },
  { tag: t.url, color: "var(--syntax-link)", textDecoration: "underline" },
  { tag: t.monospace, color: "var(--syntax-code)" },
  { tag: t.quote, color: "var(--syntax-quote)", fontStyle: "italic" },
  // Markdown punctuation (# * > - ``` and so on) recedes so the words stand out.
  { tag: [t.processingInstruction, t.meta, t.contentSeparator, t.list], color: "var(--syntax-marker)" },
]);

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-mono)" },
  ".cm-content": {
    caretColor: "var(--primary)",
    padding: "1.1rem 1.5rem 2rem",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--primary)", borderLeftWidth: "2px" },
  // CodeMirror's own search panel is replaced by the app's find bar; keep its (empty) shell out of sight.
  ".cm-panels": { display: "none" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--muted-foreground)",
    border: "none",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in oklab, var(--primary) 7%, transparent)" },
  ".cm-activeLineGutter": {
    backgroundColor: "color-mix(in oklab, var(--primary) 7%, transparent)",
    color: "var(--foreground)",
  },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "color-mix(in oklab, var(--primary) 28%, transparent)",
  },
  // Find results: every match softly tinted, the selected one stronger with an outline.
  ".cm-searchMatch": {
    backgroundColor: "color-mix(in oklab, var(--primary) 22%, transparent)",
    outline: "1px solid color-mix(in oklab, var(--primary) 45%, transparent)",
    borderRadius: "2px",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "color-mix(in oklab, var(--primary) 45%, transparent)",
    outline: "2px solid var(--primary)",
  },
  ".cm-selectionMatch": { backgroundColor: "color-mix(in oklab, var(--primary) 16%, transparent)" },
});

export const markoraEditorTheme: Extension[] = [editorTheme, syntaxHighlighting(markdownHighlight)];
