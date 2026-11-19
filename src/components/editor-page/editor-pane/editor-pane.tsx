import { useEffect, useMemo, useRef, useState } from "react";
import { redo, selectAll, undo } from "@codemirror/commands";
import { EditorView, basicSetup } from "codemirror";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import { EditorView as CMView, keymap } from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useDocumentStore } from "../../../store/document";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { findExtensions } from "../../../features/editor/find-replace";
import { markoraEditorTheme } from "../../../features/editor/editor-theme";
import { createEditorSettingsExtensions } from "../../../features/editor/editor-settings-extensions";
import { liveExtension } from "../../../features/editor/live/live-extension";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";
import { applyMarkdownToolbarAction, type MarkdownToolbarAction } from "../../../features/editor/markdown-toolbar-actions";
import {
  applySlashCommand,
  getSlashCommandContext,
  matchSlashCommands,
  type SlashCommandDefinition,
} from "../../../features/editor/slash-commands";
import { useEditorStatusState } from "../../../features/workspace/editor-status-state";
import { useSettingsStore } from "../../../features/settings/settings-store";
import { getLinkAdapter } from "../../../platform/links";
import { createLinkOpener } from "../../../features/editor/live/link-opener";
import { FindBar } from "../find-bar";
import { InlineFormattingMenu } from "../inline-formatting-menu";
import { SlashCommandMenu } from "../slash-command-menu/slash-command-menu";

interface EditorPaneProps {
  theme: "light" | "dark";
  /** Live rendering is only on in "live"; the other modes show the raw markdown. */
  viewMode?: WorkspaceViewMode;
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

interface FindState {
  mode: "find" | "replace";
  initialSearch: string;
  /** Changes on every open, so pressing Ctrl+F again refocuses and refills the bar. */
  openCount: number;
}

interface InlineMenuState {
  position: {
    top: number;
    left: number;
  };
}

export function EditorPane({ theme, viewMode = "edit" }: EditorPaneProps) {
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
  // Holds the Live-mode decorations, so switching view mode reconfigures the editor in place.
  const liveCompartment = useMemo(() => new Compartment(), []);
  // Ctrl/Cmd+click on a link in Live mode; the setting is read when the click happens.
  const onOpenLink = useMemo(
    () =>
      createLinkOpener(() => useSettingsStore.getState().settings.preview.openLinksExternally, getLinkAdapter()),
    [],
  );
  const liveMode = viewMode === "live";
  // The mode the editor was last configured with; the creation effect reads it once, then the effect below keeps it current.
  const appliedLiveMode = useRef(liveMode);
  const setCursorPosition = useEditorStatusState((state) => state.setCursorPosition);
  const setRunToolbarAction = useEditorCommandState((state) => state.setRunToolbarAction);
  const setRunEditAction = useEditorCommandState((state) => state.setRunEditAction);
  const setGoToLine = useEditorCommandState((state) => state.setGoToLine);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [inlineMenu, setInlineMenu] = useState<InlineMenuState | null>(null);
  const [find, setFind] = useState<FindState | null>(null);
  // Bumped when the document or selection changes while the find bar is open, so its count stays current.
  const [findVersion, setFindVersion] = useState(0);
  const findOpen = useRef(false);
  findOpen.current = find !== null;
  const openFind = (mode: FindState["mode"]) => {
    const view = viewRef.current;
    const { from, to } = view?.state.selection.main ?? { from: 0, to: 0 };
    const selected = view && to > from ? view.state.sliceDoc(from, to) : "";
    // A one-line selection becomes the search; a multi-line one is probably not what you want to find.
    const initialSearch = selected && !selected.includes("\n") && selected.length <= 200 ? selected : "";
    setFind((current) => ({ mode, initialSearch, openCount: (current?.openCount ?? 0) + 1 }));
    return true;
  };
  const closeFind = () => {
    setFind(null);
    viewRef.current?.focus();
  };

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

      if (findOpen.current && (update.docChanged || update.selectionSet)) {
        setFindVersion((version) => version + 1);
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

        // The flyout only appears for a real selection, not for a bare caret.
        const selection = update.state.selection.main;
        if (update.view.hasFocus && selection.from !== selection.to) {
          setInlineMenu({
            position: getFloatingPosition(selection.to),
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
        // The GFM base adds strikethrough, tables, task lists and bare-URL links to the tree.
        markdown({ base: markdownLanguage }),
        updateListener,
        ...findExtensions,
        // Highest precedence, so these beat CodeMirror's own search panel bindings.
        Prec.highest(
          keymap.of([
            { key: "Mod-f", run: () => openFind("find"), preventDefault: true },
            { key: "Mod-h", run: () => openFind("replace"), preventDefault: true },
          ]),
        ),
        ...markoraEditorTheme,
        liveCompartment.of(appliedLiveMode.current ? liveExtension({ onOpenLink }) : []),
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
  }, [liveCompartment, onOpenLink, setContent, setCursorPosition, settingsCompartment]);

  useEffect(() => {
    if (appliedLiveMode.current === liveMode) return;
    appliedLiveMode.current = liveMode;
    viewRef.current?.dispatch({
      effects: liveCompartment.reconfigure(liveMode ? liveExtension({ onOpenLink }) : []),
    });
  }, [liveCompartment, liveMode, onOpenLink]);

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
    setGoToLine((line) => {
      const view = viewRef.current;
      if (!view) return;

      const { doc } = view.state;
      const position = doc.line(Math.min(Math.max(1, line), doc.lines)).from;
      view.dispatch({
        selection: { anchor: position },
        effects: CMView.scrollIntoView(position, { y: "start", yMargin: 24 }),
      });
      view.focus();
    });
    return () => setGoToLine(() => {});
  }, [setGoToLine]);

  useEffect(() => {
    setRunToolbarAction(runMarkdownAction);
    return () => setRunToolbarAction(() => {});
  }, [setRunToolbarAction]);

  useEffect(() => {
    const runEditAction = async (
      action: "undo" | "redo" | "cut" | "copy" | "paste" | "selectAll" | "find" | "replace",
    ) => {
      const view = viewRef.current;
      if (!view) return;

      if (action === "find" || action === "replace") {
        openFind(action);
        return;
      }

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
      <div className="editor-pane__panel flex h-full flex-col overflow-hidden rounded-xl border bg-editor shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
        <div className="relative min-h-0 flex-1">
          <div
            ref={containerRef}
            className="editor-pane__surface h-full min-h-0 flex-1 overflow-hidden"
            data-testid="editor-surface"
            data-line-numbers={lineNumbers ? "visible" : "hidden"}
          />
          {find ? (
            <FindBar
              key={find.openCount}
              view={viewRef.current}
              initialMode={find.mode}
              initialSearch={find.initialSearch}
              version={findVersion}
              onClose={closeFind}
            />
          ) : null}
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
