import { Download, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Menubar } from "@/components/ui/menubar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "../../logo";
import { SyntaxToggle, ViewModeSwitcher } from "../view-mode-switcher";
import type { AppCommand } from "../../../features/commands/palette-commands";
import { useThemeStore } from "../../../features/theme/theme-store";
import { useUpdateStore } from "../../../features/updates/update-store";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";
import { useDocumentStore } from "../../../store/document";
import { AppMenus, type RecentFile } from "./menu-renderer";

interface TopBarProps {
  /** The document tabs, shown on their own row below the menus and view controls. */
  tabs?: ReactNode;
  /** Every app command; the menus lay them out and run them. */
  commands: AppCommand[];
  recentFiles?: RecentFile[];
  onOpenRecent?: (projectId: string, documentId: string) => void;
  onThemeToggle?: () => void;
  canInstallApp?: boolean;
  onInstallApp?: () => void;
  /** False on the web build, where the app cannot update itself, so no update dot is shown. */
  updatesSupported?: boolean;
  viewMode: WorkspaceViewMode;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
  /** Whether Write shows raw markdown; the toggle appears only in the Write view. */
  showSyntax?: boolean;
  onShowSyntaxChange?: (on: boolean) => void;
}

export function TopBar({
  tabs,
  commands,
  recentFiles = [],
  onOpenRecent = () => {},
  onThemeToggle = () => {},
  canInstallApp = false,
  onInstallApp = () => {},
  updatesSupported = false,
  viewMode,
  onViewModeChange,
  showSyntax = false,
  onShowSyntaxChange = () => {},
}: TopBarProps) {
  const hasActiveDocument = useDocumentStore((state) => Boolean(state.activeDocumentId));
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const updateStatus = useUpdateStore((state) => state.status);
  const updateAvailable = updatesSupported && (updateStatus === "available" || updateStatus === "downloading" || updateStatus === "ready");

  return (
    // The tabs sit on their own row (order-last + full width) so they never compete with the menus and view controls.
    <header className="top-bar flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1 border-b bg-card/70 px-2 py-1.5 backdrop-blur-md">
      <div className="flex shrink-0 items-center gap-1.5" data-testid="top-bar-menu" data-tour="command-palette">
        <Logo size={24} showLabel={!hasActiveDocument} className="mx-1" />
        <Menubar className="h-auto gap-0.5 border-0 bg-transparent p-0 shadow-none">
          <AppMenus commands={commands} recentFiles={recentFiles} onOpenRecent={onOpenRecent} updateAvailable={updateAvailable} />
        </Menubar>
      </div>

      {tabs ? <div className="order-last flex w-full min-w-0 items-center">{tabs}</div> : null}

      <div className="ml-auto flex shrink-0 items-center gap-1.5" data-testid="top-bar-utilities">
        {canInstallApp ? (
          <Button size="sm" variant="outline" onClick={onInstallApp}>
            <Download aria-hidden="true" /> Install app
          </Button>
        ) : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Toggle theme" data-tour="theme" onClick={onThemeToggle}>
              {resolvedTheme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>
        {hasActiveDocument ? (
          <>
            {/* Show syntax only changes the Write view, so it is only offered there. */}
            {viewMode === "write" ? <SyntaxToggle checked={showSyntax} onCheckedChange={onShowSyntaxChange} /> : null}
            <ViewModeSwitcher value={viewMode} onValueChange={onViewModeChange} />
          </>
        ) : null}
      </div>
    </header>
  );
}
