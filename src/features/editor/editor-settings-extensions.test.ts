// Uses the real CodeMirror (the EditorPane tests mock it), so this checks what the
// extensions actually do to a live editor.
import { afterEach, describe, expect, it } from "vitest";
import { basicSetup, EditorView } from "codemirror";
import { Compartment, EditorState } from "@codemirror/state";
import { createDefaultSettings } from "../settings/settings-schema";
import { createEditorSettingsExtensions } from "./editor-settings-extensions";

function setup() {
  const { editor, appearance } = createDefaultSettings();
  return { editor, appearance };
}

function mount(extensions: ReturnType<typeof createEditorSettingsExtensions>) {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const compartment = new Compartment();
  const view = new EditorView({
    state: EditorState.create({ doc: "hello", extensions: [basicSetup, compartment.of(extensions)] }),
    parent,
  });
  return { view, compartment, parent };
}

/** All CSS CodeMirror has injected so far. */
function injectedCss() {
  const fromSheets = Array.from(document.adoptedStyleSheets ?? []).flatMap((sheet) =>
    Array.from(sheet.cssRules).map((rule) => rule.cssText),
  );
  const fromTags = Array.from(document.querySelectorAll("style")).map((tag) => tag.textContent ?? "");
  return [...fromSheets, ...fromTags].join("\n");
}

describe("createEditorSettingsExtensions", () => {
  let mounted: ReturnType<typeof mount> | null = null;

  afterEach(() => {
    mounted?.view.destroy();
    mounted?.parent.remove();
    mounted = null;
  });

  it("wraps long lines when word wrap is on", () => {
    const { editor, appearance } = setup();
    mounted = mount(createEditorSettingsExtensions({ ...editor, wordWrap: true }, appearance));

    expect(mounted.view.contentDOM.classList.contains("cm-lineWrapping")).toBe(true);
  });

  it("does not wrap when word wrap is off", () => {
    const { editor, appearance } = setup();
    mounted = mount(createEditorSettingsExtensions({ ...editor, wordWrap: false }, appearance));

    expect(mounted.view.contentDOM.classList.contains("cm-lineWrapping")).toBe(false);
  });

  it("switches word wrap on a live editor without rebuilding it", () => {
    const { editor, appearance } = setup();
    mounted = mount(createEditorSettingsExtensions({ ...editor, wordWrap: true }, appearance));
    const view = mounted.view;

    view.dispatch({
      effects: mounted.compartment.reconfigure(
        createEditorSettingsExtensions({ ...editor, wordWrap: false }, appearance),
      ),
    });

    expect(view.contentDOM.classList.contains("cm-lineWrapping")).toBe(false);
    expect(view.state.doc.toString()).toBe("hello");
  });

  it("applies font size and line height", () => {
    const { editor, appearance } = setup();
    mounted = mount(
      createEditorSettingsExtensions(editor, { editorFontSize: 21, editorLineHeight: 2.1 }),
    );

    const css = injectedCss();
    expect(css).toMatch(/font-size:\s*21px/);
    expect(css).toMatch(/line-height:\s*2\.1/);
    expect(appearance.editorFontSize).toBe(16);
  });

  it("only neutralises the active line highlight when the setting is off", () => {
    const { editor, appearance } = setup();
    mounted = mount(
      createEditorSettingsExtensions({ ...editor, highlightActiveLine: true }, appearance),
    );
    expect(injectedCss()).not.toMatch(/cm-activeLine\s*\{[^}]*background-color:\s*transparent/);
    mounted.view.destroy();
    mounted.parent.remove();

    mounted = mount(
      createEditorSettingsExtensions({ ...editor, highlightActiveLine: false }, appearance),
    );
    expect(injectedCss()).toMatch(/\.cm-activeLine\s*\{[^}]*background-color:\s*transparent/);
  });

  it("hides the line-number gutter unless line numbers are on", () => {
    const { editor, appearance } = setup();
    mounted = mount(createEditorSettingsExtensions({ ...editor, lineNumbers: false }, appearance));

    expect(injectedCss()).toMatch(/\.cm-gutters\s*\{[^}]*display:\s*none/);
  });
});
