import { useEffect, useMemo, useRef, useState } from "react";
import { redo, selectAll, undo } from "@codemirror/commands";
import { EditorView, basicSetup } from "codemirror";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView as CMView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useDocumentStore } from "../../../store/document";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { markoraEditorTheme } from "../../../features/editor/editor-theme";
import { createEditorSettingsExtensions } from "../../../features/editor/editor-settings-extensions";
import { applyMarkdownToolbarAction, type MarkdownToolbarAction } from "../../../features/editor/markdown-toolbar-actions";
import {
  applySlashCommand,
  getSlashCommandContext,
  matchSlashCommands,
  type SlashCommandDefinition,
} from "../../../features/editor/slash-commands";
import { useEditorStatusState } from "../../../features/workspace/editor-status-state";
import { useSettingsStore } from "../../../features/settings/settings-store";
import { InlineFormattingMenu } from "../inline-formatting-menu";
import { SlashCommandMenu } from "../slash-command-menu/slash-command-menu";

interface EditorPaneProps {
  theme: "light" | "dark";
}

interface SlashMenuState {
  commands: SlashCommandDefinition[];
  selectedIndex: number;
  from: number;
  to: number;
  position: {
    top: number;
    left: number;
  };
}

interface InlineMenuState {
  position: {
    top: number;
    left: number;
  };
}

export function EditorPane({ theme }: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the imperative CodeMirror instance in a ref so React re-renders do not recreate it.
  const viewRef = useRef<EditorView | null>(null);
  const { content, setContent } = useDocumentStore();
  const editorSettings = useSettingsStore((state) => state.settings.editor);
  const editorFontSize = useSettingsStore((state) => state.settings.appearance.editorFontSize);
  const editorLineHeight = useSettingsStore((state) => state.settings.appearance.editorLineHeight);
  const lineNumbers = editorSettings.lineNumbers;
  // Holds the settings-driven extensions so they can be swapped without rebuilding the editor.
  const settingsCompartment = useMemo(() => new Compartment(), []);
  const setCursorPosition = useEditorStatusState((state) => state.setCursorPosition);
  const setRunToolbarAction = useEditorCommandState((state) => state.setRunToolbarAction);
  const setRunEditAction = useEditorCommandState((state) => state.setRunEditAction);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [inlineMenu, setInlineMenu] = useState<InlineMenuState | null>(null);

  const applyEditResult = (text: string, selectionStart: number, selectionEnd: number) => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
      selection: { anchor: selectionStart, head: selectionEnd },
    });
    view.focus();
  };

  const applySelectedSlashCommand = (commandId: SlashCommandDefinition["id"]) => {
    const view = viewRef.current;
    if (!view || !slashMenu) return;

    const result = applySlashCommand(
      view.state.doc.toString(),
      slashMenu.from,
      slashMenu.to,
      commandId,
    );

    applyEditResult(result.text, result.selectionStart, result.selectionEnd);
    setSlashMenu(null);
  };

  const runMarkdownAction = (action: MarkdownToolbarAction) => {
    const view = viewRef.current;
    if (!view) return;

    const selection = view.state.selection.main;
    const result = applyMarkdownToolbarAction(
      view.state.doc.toString(),
      selection.from,
      selection.to,
      action,
    );

    applyEditResult(result.text, result.selectionStart, result.selectionEnd);
  };

  const getFloatingPosition = (anchor: number) => {
    const coords = viewRef.current?.coordsAtPos(anchor);
    const containerBounds = containerRef.current?.getBoundingClientRect();

    return {
      top: (coords?.bottom ?? 0) - (containerBounds?.top ?? 0) + 10,
      left: (coords?.left ?? 0) - (containerBounds?.left ?? 0),
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = CMView.updateListener.of((update) => {
      if (update.docChanged) {
        // Push user edits from CodeMirror into the Zustand store.
        setContent(update.state.doc.toString());
      }

      if (update.docChanged || update.selectionSet || update.focusChanged) {
        const cursor = update.state.selection.main.head;
        const line = update.state.doc.lineAt(cursor);
        setCursorPosition(line.number, cursor - line.from + 1);

        const context = getSlashCommandContext(update.state.doc.toString(), cursor);
        if (!context) {
          setSlashMenu(null);
        } else {
          const commands = matchSlashCommands(context.query);
          if (commands.length === 0) {
            setSlashMenu(null);
          } else {
            setSlashMenu({
              commands,
              selectedIndex: 0,
              from: context.from,
              to: context.to,
              position: getFloatingPosition(cursor),
            });
            setInlineMenu(null);
            return;
          }
        }

        if (update.view.hasFocus) {
          const selection = update.state.selection.main;
          const anchor = selection.from === selection.to ? selection.head : selection.to;
          setInlineMenu({
            position: getFloatingPosition(anchor),
          });
        } else {
          setInlineMenu(null);
        }
      }
    });

    const { settings } = useSettingsStore.getState();
    const state = EditorState.create({
      // Read the latest store value at creation time so the editor boots with current content.
      doc: useDocumentStore.getState().content,
      extensions: [
        basicSetup,
        markdown(),
        updateListener,
        ...markoraEditorTheme,
        // Last, so user settings win over the theme where both style the same thing.
        settingsCompartment.of(
          createEditorSettingsExtensions(settings.editor, settings.appearance, theme === "dark"),
        ),
      ],
    });

    viewRef.current?.destroy();
    // CodeMirror mounts itself into an existing DOM node instead of returning JSX.
    viewRef.current = new EditorView({ state, parent: containerRef.current });

    return () => {
      viewRef.current?.destroy();
    };
    // The theme is read once here and then kept current by the effect below, so switching
    // light/dark doesn't rebuild the editor (which would lose undo history and the cursor).
  }, [setContent, setCursorPosition, settingsCompartment]);

  useEffect(() => {
    // Apply setting changes to the live editor (the creation effect only reads them once).
    viewRef.current?.dispatch({
      effects: settingsCompartment.reconfigure(
        createEditorSettingsExtensions(
          editorSettings,
          { editorFontSize, editorLineHeight },
          theme === "dark",
        ),
      ),
    });
  }, [editorFontSize, editorLineHeight, editorSettings, settingsCompartment, theme]);

  useEffect(() => {
    setRunToolbarAction(runMarkdownAction);
    return () => setRunToolbarAction(() => {});
  }, [setRunToolbarAction]);

  useEffect(() => {
    const runEditAction = async (
      action: "undo" | "redo" | "cut" | "copy" | "paste" | "selectAll",
    ) => {
      const view = viewRef.current;
      if (!view) return;

      const { from, to } = view.state.selection.main;
      const selectedText = view.state.doc.toString().slice(from, to);

      switch (action) {
        case "undo":
          undo(view);
          view.focus();
          return;
        case "redo":
          redo(view);
          view.focus();
          return;
        case "selectAll":
          selectAll(view);
          view.focus();
          return;
        case "copy":
          if (selectedText) {
            await writeText(selectedText);
          }
          view.focus();
          return;
        case "cut":
          if (selectedText) {
            await writeText(selectedText);
            view.dispatch({
              changes: { from, to, insert: "" },
              selection: { anchor: from },
            });
          }
          view.focus();
          return;
        case "paste":
          {
            const clipboardText = await readText();
            if (clipboardText) {
              view.dispatch({
                changes: { from, to, insert: clipboardText },
                selection: { anchor: from + clipboardText.length },
              });
            }
          }
          view.focus();
      }
    };

    setRunEditAction(runEditAction);
    return () => setRunEditAction(async () => {});
  }, [setRunEditAction]);

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
    <section
      className="editor-pane h-full min-h-0 pb-0 pr-0"
      aria-label="Editor"
      onKeyDownCapture={(event) => {
        if (!slashMenu) return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashMenu((current) =>
            current
              ? {
                  ...current,
                  selectedIndex: (current.selectedIndex + 1) % current.commands.length,
                }
              : current,
          );
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashMenu((current) =>
            current
              ? {
                  ...current,
                  selectedIndex:
                    (current.selectedIndex - 1 + current.commands.length) % current.commands.length,
                }
              : current,
          );
        }

        if (event.key === "Enter") {
          event.preventDefault();
          const selectedCommand = slashMenu.commands[slashMenu.selectedIndex];
          if (selectedCommand) {
            applySelectedSlashCommand(selectedCommand.id);
          }
        }

        if (event.key === "Escape") {
          event.preventDefault();
          setSlashMenu(null);
        }
      }}
    >
      <div className="editor-pane__panel flex h-full flex-col overflow-hidden rounded-xl border bg-editor shadow-sm">
        <div className="relative min-h-0 flex-1">
          <div
            ref={containerRef}
            className="editor-pane__surface h-full min-h-0 flex-1 overflow-hidden"
            data-testid="editor-surface"
            data-line-numbers={lineNumbers ? "visible" : "hidden"}
          />
          {slashMenu ? (
            <SlashCommandMenu
              commands={slashMenu.commands}
              selectedIndex={slashMenu.selectedIndex}
              position={slashMenu.position}
              onSelect={applySelectedSlashCommand}
            />
          ) : null}
          {inlineMenu && !slashMenu ? (
            <InlineFormattingMenu position={inlineMenu.position} onSelect={runMarkdownAction} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
