import {
  CircleHelp,
  Clipboard,
  Copy,
  Eye,
  FileInput,
  FileOutput,
  FolderOpen,
  Info,
  MoonStar,
  PanelLeftClose,
  PanelsTopLeft,
  Redo2,
  Save,
  Scissors,
  Settings2,
  SquarePen,
  Type,
  Undo2,
} from "lucide-react";
import { MenuBar } from "../../shared/menu-bar";
import { IconButton } from "../../shared/icon-button";
import { FormattingToolbar } from "../formatting-toolbar";
import { ViewModeSwitcher } from "../view-mode-switcher";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";

function getModifierLabel() {
  if (typeof navigator === "undefined") {
    return "Ctrl";
  }

  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "Cmd" : "Ctrl";
}

interface TopBarProps {
  onOpenSettings?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onOpenAbout?: () => void;
  onThemeToggle?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onCloseTab?: () => void;
  viewMode: WorkspaceViewMode;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
}

export function TopBar({
  onOpenSettings = () => {},
  onOpenKeyboardShortcuts = () => {},
  onOpenAbout = () => {},
  onThemeToggle = () => {},
  onNew = () => {},
  onOpen = () => {},
  onSave = () => {},
  onSaveAs = () => {},
  onCloseTab = () => {},
  viewMode,
  onViewModeChange,
}: TopBarProps) {
  const runToolbarAction = useEditorCommandState((state) => state.runToolbarAction);
  const runEditAction = useEditorCommandState((state) => state.runEditAction);
  const modifierLabel = getModifierLabel();
  const menuGroups = [
    {
      label: "File",
      items: [
        { label: "New", icon: <SquarePen className="size-4" />, shortcut: `${modifierLabel}+N`, onSelect: onNew },
        { label: "Open", icon: <FolderOpen className="size-4" />, shortcut: `${modifierLabel}+O`, onSelect: onOpen },
        { label: "Save", icon: <Save className="size-4" />, shortcut: `${modifierLabel}+S`, onSelect: onSave },
        { label: "Save As", icon: <FileOutput className="size-4" />, shortcut: `${modifierLabel}+Shift+S`, onSelect: onSaveAs },
        { label: "Close Tab", icon: <PanelLeftClose className="size-4" />, onSelect: onCloseTab },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", icon: <Undo2 className="size-4" />, shortcut: `${modifierLabel}+Z`, onSelect: () => void runEditAction("undo") },
        { label: "Redo", icon: <Redo2 className="size-4" />, shortcut: `${modifierLabel}+Shift+Z`, onSelect: () => void runEditAction("redo") },
        { label: "Cut", icon: <Scissors className="size-4" />, shortcut: `${modifierLabel}+X`, onSelect: () => void runEditAction("cut") },
        { label: "Copy", icon: <Copy className="size-4" />, shortcut: `${modifierLabel}+C`, onSelect: () => void runEditAction("copy") },
        { label: "Paste", icon: <Clipboard className="size-4" />, shortcut: `${modifierLabel}+V`, onSelect: () => void runEditAction("paste") },
        { label: "Select All", icon: <Type className="size-4" />, shortcut: `${modifierLabel}+A`, onSelect: () => void runEditAction("selectAll") },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Edit View", icon: <FileInput className="size-4" />, onSelect: () => onViewModeChange("edit") },
        { label: "Split View", icon: <PanelsTopLeft className="size-4" />, onSelect: () => onViewModeChange("split") },
        { label: "Preview View", icon: <Eye className="size-4" />, onSelect: () => onViewModeChange("preview") },
        { label: "Toggle Theme", icon: <MoonStar className="size-4" />, onSelect: onThemeToggle },
        { label: "Open Settings", icon: <Settings2 className="size-4" />, onSelect: onOpenSettings },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Keyboard Shortcuts", icon: <CircleHelp className="size-4" />, onSelect: onOpenKeyboardShortcuts },
        { label: "About Markora", icon: <Info className="size-4" />, onSelect: onOpenAbout },
      ],
    },
  ];

  return (
    <header className="top-bar grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--glass-border)] bg-[color:var(--glass-panel-strong)] px-3 py-2 backdrop-blur-[var(--glass-blur-strong)] supports-[backdrop-filter]:bg-[color:var(--glass-panel-strong)]">
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
        className="flex items-center justify-end gap-2 rounded-app-sm p-0.5"
        data-testid="top-bar-utilities"
      >
        <ViewModeSwitcher value={viewMode} onValueChange={onViewModeChange} />
        <IconButton label="Settings" type="button" onClick={onOpenSettings}>
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
