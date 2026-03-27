import { MenuBar } from "../../shared/menu-bar";
import { IconButton } from "../../shared/icon-button";
import { FormattingToolbar } from "../formatting-toolbar";
import { ViewModeSwitcher } from "../view-mode-switcher";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";

interface TopBarProps {
  onThemeToggle: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  viewMode: WorkspaceViewMode;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
}

export function TopBar({
  onThemeToggle,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  viewMode,
  onViewModeChange,
}: TopBarProps) {
  const runToolbarAction = useEditorCommandState((state) => state.runToolbarAction);
  const menuGroups = [
    {
      label: "File",
      items: [
        { label: "New", onSelect: onNew },
        { label: "Open", onSelect: onOpen },
        { label: "Save", onSelect: onSave },
        { label: "Save As", onSelect: onSaveAs },
      ],
    },
    {
      label: "Edit",
      items: [{ label: "Undo", disabled: true }, { label: "Redo", disabled: true }],
    },
    {
      label: "View",
      items: [{ label: "Theme", onSelect: onThemeToggle }, { label: "Live Preview", disabled: true }],
    },
    {
      label: "Help",
      items: [
        { label: "Keyboard Shortcuts", disabled: true },
        { label: "About Markora", disabled: true },
      ],
    },
  ];

  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--ghost-border)] bg-app-panel/90 px-3 py-2 backdrop-blur-md">
      <div className="flex min-w-0 items-center justify-start gap-2" data-testid="top-bar-menu">
        <MenuBar groups={menuGroups} />
      </div>
      <div
        className="flex min-w-0 items-center justify-center"
        data-testid="top-bar-toolbar"
      >
        <FormattingToolbar
          onHeading={() => runToolbarAction("heading")}
          onBold={() => runToolbarAction("bold")}
          onItalic={() => runToolbarAction("italic")}
          onStrike={() => runToolbarAction("strike")}
          onBulletList={() => runToolbarAction("bulletList")}
          onOrderedList={() => runToolbarAction("orderedList")}
          onTaskList={() => runToolbarAction("taskList")}
          onQuote={() => runToolbarAction("quote")}
          onCodeBlock={() => runToolbarAction("codeBlock")}
          onLink={() => runToolbarAction("link")}
          onTable={() => runToolbarAction("table")}
          onImage={() => runToolbarAction("image")}
        />
      </div>
      <div
        className="flex items-center justify-end gap-2 rounded-full p-0"
        data-testid="top-bar-utilities"
      >
        <ViewModeSwitcher value={viewMode} onValueChange={onViewModeChange} />
        <IconButton label="Settings" type="button">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3.25" />
            <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.7Z" />
          </svg>
        </IconButton>
      </div>
    </header>
  );
}
