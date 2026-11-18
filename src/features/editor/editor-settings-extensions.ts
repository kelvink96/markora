import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { AppearanceSettings, EditorSettings } from "../settings/settings-schema";

/**
 * CodeMirror extensions that depend on user settings or the app theme: word wrap, font size,
 * line height, line-number gutter, active-line highlight, and whether the theme is dark. The
 * editor keeps these in a Compartment, so changing any of them reconfigures the live editor in
 * place (no rebuild, so undo history and the cursor survive).
 */
export function createEditorSettingsExtensions(
  editor: EditorSettings,
  appearance: Pick<AppearanceSettings, "editorFontSize" | "editorLineHeight">,
  isDark = false,
): Extension[] {
  return [
    EditorView.darkTheme.of(isDark),
    editor.wordWrap ? EditorView.lineWrapping : [],
    EditorView.theme({
      "&": { fontSize: `${appearance.editorFontSize}px` },
      ".cm-content": { lineHeight: String(appearance.editorLineHeight) },
      ".cm-gutters": { display: editor.lineNumbers ? "flex" : "none" },
      // The extra .cm-editor class outranks the active-line colour that dark themes set.
      ...(editor.highlightActiveLine
        ? {}
        : {
            "&.cm-editor .cm-activeLine": { backgroundColor: "transparent" },
            "&.cm-editor .cm-activeLineGutter": { backgroundColor: "transparent" },
          }),
    }),
  ];
}
