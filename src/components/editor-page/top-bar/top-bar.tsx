import {
  BookOpen,
  CircleHelp,
  Command,
  Clipboard,
  Clock,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileInput,
  FileOutput,
  FolderOpen,
  Info,
  ListTree,
  Moon,
  PanelLeftClose,
  PanelsTopLeft,
  Printer,
  Redo2,
  Replace,
  Save,
  Scissors,
  Search,
  Settings2,
  SquarePen,
  Sun,
  Type,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "../../logo";
import { ViewModeSwitcher } from "../view-mode-switcher";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { getModifierLabel } from "../../../features/shortcuts/modifier-label";
import { useThemeStore } from "../../../features/theme/theme-store";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";
import { useDocumentStore } from "../../../store/document";

interface TopBarProps {
  /** The document tabs, shown between the menus and the view controls. */
  tabs?: ReactNode;
  onOpenSettings?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onOpenAbout?: () => void;
  onOpenReleaseNotes?: () => void;
  onThemeToggle?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onCloseTab?: () => void;
  onExportHtml?: () => void;
  onExportPdf?: () => void;
  showOutline?: boolean;
  onToggleOutline?: () => void;
  recentFiles?: Array<{ documentId: string; projectId: string; title: string }>;
  onOpenRecent?: (projectId: string, documentId: string) => void;
  canInstallApp?: boolean;
  onInstallApp?: () => void;
  viewMode: WorkspaceViewMode;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
}

export function TopBar({
  tabs,
  onOpenSettings = () => {},
  onOpenCommandPalette = () => {},
  onOpenKeyboardShortcuts = () => {},
  onOpenAbout = () => {},
  onOpenReleaseNotes = () => {},
  onThemeToggle = () => {},
  onNew = () => {},
  onOpen = () => {},
  onSave = () => {},
  onSaveAs = () => {},
  onCloseTab = () => {},
  onExportHtml = () => {},
  onExportPdf = () => {},
  showOutline = false,
  onToggleOutline = () => {},
  recentFiles = [],
  onOpenRecent = () => {},
  canInstallApp = false,
  onInstallApp = () => {},
  viewMode,
  onViewModeChange,
}: TopBarProps) {
  const runEditAction = useEditorCommandState((state) => state.runEditAction);
  const hasActiveDocument = useDocumentStore((state) => Boolean(state.activeDocumentId));
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const mod = getModifierLabel();
  const iconClass = "size-4";

  return (
    // On narrow screens the tabs wrap onto their own row (order-last + full width) instead of being squeezed out.
    <header className="top-bar flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1 border-b bg-card/70 px-2 py-1.5 backdrop-blur-md md:flex-nowrap md:py-0">
      <div className="flex shrink-0 items-center gap-1.5" data-testid="top-bar-menu">
        <Logo size={24} showLabel={!hasActiveDocument} className="mx-1" />
        <Menubar className="h-auto gap-0.5 border-0 bg-transparent p-0 shadow-none">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent className="min-w-60">
              <MenubarItem onSelect={onNew}>
                <SquarePen className={iconClass} /> New <MenubarShortcut>{mod}+N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={onOpen}>
                <FolderOpen className={iconClass} /> Open <MenubarShortcut>{mod}+O</MenubarShortcut>
              </MenubarItem>
              {hasActiveDocument ? (
                <>
                  <MenubarSeparator />
                  <MenubarItem onSelect={onSave}>
                    <Save className={iconClass} /> Save <MenubarShortcut>{mod}+S</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem onSelect={onSaveAs}>
                    <FileOutput className={iconClass} /> Save As <MenubarShortcut>{mod}+Shift+S</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onSelect={onExportHtml}>
                    <FileCode2 className={iconClass} /> Export as HTML
                  </MenubarItem>
                  <MenubarItem onSelect={onExportPdf}>
                    <Printer className={iconClass} /> Export as PDF
                  </MenubarItem>
                </>
              ) : null}
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>
                  <Clock className={iconClass} /> Open Recent
                </MenubarSubTrigger>
                <MenubarSubContent>
                  {recentFiles.length > 0 ? (
                    recentFiles.map((entry) => (
                      <MenubarItem
                        key={`${entry.projectId}:${entry.documentId}`}
                        onSelect={() => onOpenRecent(entry.projectId, entry.documentId)}
                      >
                        {entry.title}
                      </MenubarItem>
                    ))
                  ) : (
                    <MenubarItem disabled>No recent files</MenubarItem>
                  )}
                </MenubarSubContent>
              </MenubarSub>
              {hasActiveDocument ? (
                <>
                  <MenubarSeparator />
                  <MenubarItem onSelect={onCloseTab}>
                    <PanelLeftClose className={iconClass} /> Close Tab
                  </MenubarItem>
                </>
              ) : null}
              <MenubarSeparator />
              <MenubarItem onSelect={onOpenSettings}>
                <Settings2 className={iconClass} /> Settings
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {hasActiveDocument ? (
            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={() => void runEditAction("undo")}>
                  <Undo2 className={iconClass} /> Undo <MenubarShortcut>{mod}+Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => void runEditAction("redo")}>
                  <Redo2 className={iconClass} /> Redo <MenubarShortcut>{mod}+Shift+Z</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={() => void runEditAction("cut")}>
                  <Scissors className={iconClass} /> Cut <MenubarShortcut>{mod}+X</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => void runEditAction("copy")}>
                  <Copy className={iconClass} /> Copy <MenubarShortcut>{mod}+C</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => void runEditAction("paste")}>
                  <Clipboard className={iconClass} /> Paste <MenubarShortcut>{mod}+V</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={() => void runEditAction("selectAll")}>
                  <Type className={iconClass} /> Select All <MenubarShortcut>{mod}+A</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={() => void runEditAction("find")}>
                  <Search className={iconClass} /> Find <MenubarShortcut>{mod}+F</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => void runEditAction("replace")}>
                  <Replace className={iconClass} /> Replace <MenubarShortcut>{mod}+H</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          ) : null}

          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              {hasActiveDocument ? (
                <>
                  <MenubarItem onSelect={() => onViewModeChange("edit")}>
                    <FileInput className={iconClass} /> Edit View
                  </MenubarItem>
                  <MenubarItem onSelect={() => onViewModeChange("split")}>
                    <PanelsTopLeft className={iconClass} /> Split View
                  </MenubarItem>
                  <MenubarItem onSelect={() => onViewModeChange("preview")}>
                    <Eye className={iconClass} /> Preview View
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onSelect={onToggleOutline}>
                    <ListTree className={iconClass} /> {showOutline ? "Hide Outline" : "Show Outline"}
                  </MenubarItem>
                  <MenubarSeparator />
                </>
              ) : null}
              <MenubarItem onSelect={onThemeToggle}>
                {resolvedTheme === "dark" ? <Sun className={iconClass} /> : <Moon className={iconClass} />} Toggle Theme
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={onOpenCommandPalette}>
                <Command className={iconClass} /> Command Palette <MenubarShortcut>{mod}+K</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={onOpenKeyboardShortcuts}>
                <CircleHelp className={iconClass} /> Keyboard Shortcuts
              </MenubarItem>
              <MenubarItem onSelect={onOpenReleaseNotes}>
                <BookOpen className={iconClass} /> Release Notes
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={onOpenAbout}>
                <Info className={iconClass} /> About Markora
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      <div className="order-last flex w-full min-w-0 items-center md:order-none md:w-auto md:flex-1">{tabs}</div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0" data-testid="top-bar-utilities">
        {canInstallApp ? (
          <Button size="sm" variant="outline" onClick={onInstallApp}>
            <Download aria-hidden="true" /> Install app
          </Button>
        ) : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Toggle theme" onClick={onThemeToggle}>
              {resolvedTheme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>
        {hasActiveDocument ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                variant="outline"
                aria-label="Outline"
                pressed={showOutline}
                onPressedChange={onToggleOutline}
              >
                <ListTree aria-hidden="true" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Outline</TooltipContent>
          </Tooltip>
        ) : null}
        {hasActiveDocument ? <ViewModeSwitcher value={viewMode} onValueChange={onViewModeChange} /> : null}
      </div>
    </header>
  );
}
