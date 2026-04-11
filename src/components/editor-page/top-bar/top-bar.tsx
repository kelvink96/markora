import {
  CircleHelp,
  Clipboard,
  Clock,
  Copy,
  Download,
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
import { MenuBar, type MenuBarGroup } from "../../shared/menu-bar";
import { Logo } from "../../shared/logo";
import { Button } from "../../shared/button";
import { FormattingToolbar } from "../formatting-toolbar";
import { ViewModeSwitcher } from "../view-mode-switcher";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";
import { useDocumentStore } from "../../../store/document";

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
  recentFiles?: Array<{ documentId: string; projectId: string; title: string }>;
  onOpenRecent?: (projectId: string, documentId: string) => void;
  canInstallApp?: boolean;
  onInstallApp?: () => void;
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
  recentFiles = [],
  onOpenRecent = () => {},
  canInstallApp = false,
  onInstallApp = () => {},
  viewMode,
  onViewModeChange,
}: TopBarProps) {
  const runToolbarAction = useEditorCommandState((state) => state.runToolbarAction);
  const runEditAction = useEditorCommandState((state) => state.runEditAction);
  const hasActiveDocument = useDocumentStore((state) => Boolean(state.activeDocumentId));
  const modifierLabel = getModifierLabel();
  const menuGroups: MenuBarGroup[] = [
    {
      label: "File",
      items: [
        { label: "New", icon: <SquarePen className="size-4" />, shortcut: `${modifierLabel}+N`, onSelect: onNew },
        { label: "Open", icon: <FolderOpen className="size-4" />, shortcut: `${modifierLabel}+O`, onSelect: onOpen },
        hasActiveDocument ? { type: "separator", label: "separator-file-save" } : null,
        hasActiveDocument ? { label: "Save", icon: <Save className="size-4" />, shortcut: `${modifierLabel}+S`, onSelect: onSave } : null,
        hasActiveDocument ? { label: "Save As", icon: <FileOutput className="size-4" />, shortcut: `${modifierLabel}+Shift+S`, onSelect: onSaveAs } : null,
        { type: "separator", label: "separator-file-recent" },
        {
          label: "Open Recent",
          icon: <Clock className="size-4" />,
          children: recentFiles.length > 0
            ? recentFiles.map((entry) => ({
                label: entry.title,
                onSelect: () => onOpenRecent(entry.projectId, entry.documentId),
              }))
            : [{ label: "No recent files", disabled: true }],
        },
        hasActiveDocument ? { type: "separator", label: "separator-file-close" } : null,
        hasActiveDocument ? { label: "Close Tab", icon: <PanelLeftClose className="size-4" />, onSelect: onCloseTab } : null,
        { type: "separator", label: "separator-file-settings" },
        { label: "Settings", icon: <Settings2 className="size-4" />, onSelect: onOpenSettings },
      ].filter(Boolean) as MenuBarGroup["items"],
    },
    {
      label: "Edit",
      items: hasActiveDocument ? [
        { label: "Undo", icon: <Undo2 className="size-4" />, shortcut: `${modifierLabel}+Z`, onSelect: () => void runEditAction("undo") },
        { label: "Redo", icon: <Redo2 className="size-4" />, shortcut: `${modifierLabel}+Shift+Z`, onSelect: () => void runEditAction("redo") },
        { label: "Cut", icon: <Scissors className="size-4" />, shortcut: `${modifierLabel}+X`, onSelect: () => void runEditAction("cut") },
        { label: "Copy", icon: <Copy className="size-4" />, shortcut: `${modifierLabel}+C`, onSelect: () => void runEditAction("copy") },
        { label: "Paste", icon: <Clipboard className="size-4" />, shortcut: `${modifierLabel}+V`, onSelect: () => void runEditAction("paste") },
        { label: "Select All", icon: <Type className="size-4" />, shortcut: `${modifierLabel}+A`, onSelect: () => void runEditAction("selectAll") },
      ] : [],
    },
    {
      label: "View",
      items: hasActiveDocument ? [
        { label: "Edit View", icon: <FileInput className="size-4" />, onSelect: () => onViewModeChange("edit") },
        { label: "Split View", icon: <PanelsTopLeft className="size-4" />, onSelect: () => onViewModeChange("split") },
        { label: "Preview View", icon: <Eye className="size-4" />, onSelect: () => onViewModeChange("preview") },
        { type: "separator", label: "separator-view-theme" },
        { label: "Toggle Theme", icon: <MoonStar className="size-4" />, onSelect: onThemeToggle },
      ] : [
        { label: "Toggle Theme", icon: <MoonStar className="size-4" />, onSelect: onThemeToggle },
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
        {!hasActiveDocument && <Logo size={24} showLabel />}
        <MenuBar groups={menuGroups} />
      </div>
      <div
        className="flex min-w-0 items-center justify-center"
        data-testid="top-bar-toolbar"
      >
        {hasActiveDocument && (
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
        )}
      </div>
      <div
        className="flex items-center justify-end gap-2 rounded-app-sm p-0.5"
        data-testid="top-bar-utilities"
      >
        {canInstallApp ? (
          <Button
            size="sm"
            variant="secondary"
            leftSection={<Download className="size-4" />}
            onClick={onInstallApp}
          >
            Install app
          </Button>
        ) : null}
        <ViewModeSwitcher value={viewMode} onValueChange={onViewModeChange} />
      </div>
    </header>
  );
}
