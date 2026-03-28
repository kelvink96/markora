import { useEffect, useRef, useState } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView as CMView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { useDocumentStore } from "../../../store/document";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { applyMarkdownToolbarAction, type MarkdownToolbarAction } from "../../../features/editor/markdown-toolbar-actions";
import {
  applySlashCommand,
  getSlashCommandContext,
  matchSlashCommands,
  type SlashCommandDefinition,
} from "../../../features/editor/slash-commands";
import { useEditorStatusState } from "../../../features/workspace/editor-status-state";
import { useSettingsStore } from "../../../features/settings/settings-store";
import { Panel } from "../../shared/panel";
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

export function EditorPane({ theme }: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the imperative CodeMirror instance in a ref so React re-renders do not recreate it.
  const viewRef = useRef<EditorView | null>(null);
  const { content, setContent } = useDocumentStore();
  const lineNumbers = useSettingsStore((state) => state.settings.editor.lineNumbers);
  const setCursorPosition = useEditorStatusState((state) => state.setCursorPosition);
  const setRunToolbarAction = useEditorCommandState((state) => state.setRunToolbarAction);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);

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
          return;
        }

        const commands = matchSlashCommands(context.query);
        if (commands.length === 0) {
          setSlashMenu(null);
          return;
        }

        const coords = viewRef.current?.coordsAtPos(cursor);
        const containerBounds = containerRef.current?.getBoundingClientRect();
        setSlashMenu({
          commands,
          selectedIndex: 0,
          from: context.from,
          to: context.to,
          position: {
            top: (coords?.bottom ?? 0) - (containerBounds?.top ?? 0) + 10,
            left: (coords?.left ?? 0) - (containerBounds?.left ?? 0),
          },
        });
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
        CMView.theme({
          ".cm-gutters": {
            display: lineNumbers ? "flex" : "none",
          },
        }),
        ...(theme === "dark" ? [oneDark] : []),
      ],
    });

    viewRef.current?.destroy();
    // CodeMirror mounts itself into an existing DOM node instead of returning JSX.
    viewRef.current = new EditorView({ state, parent: containerRef.current });

    return () => {
      viewRef.current?.destroy();
    };
  }, [lineNumbers, setContent, setCursorPosition, theme]);

  useEffect(() => {
    const runAction = (action: MarkdownToolbarAction) => {
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

    setRunToolbarAction(runAction);
    return () => setRunToolbarAction(() => {});
  }, [setRunToolbarAction]);

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
      <Panel className="editor-pane__panel flex h-full flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1">
          <div
            ref={containerRef}
            className="editor-pane__surface min-h-0 h-full flex-1 overflow-hidden rounded-[calc(var(--radius-sm)-1px)] border border-[color:var(--glass-border-strong)] bg-[color:var(--glass-elevated)] shadow-[0_1px_0_rgba(255,255,255,0.16)_inset]"
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
        </div>
      </Panel>
    </section>
  );
}
