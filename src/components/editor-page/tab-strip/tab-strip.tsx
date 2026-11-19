import { Ellipsis, Plus, X } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getDisplayFileName } from "../../../features/document/document-actions";
import type { DocumentTab } from "../../../store/document";

interface TabStripProps {
  tabs: DocumentTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCloseAllTabs: () => void;
  onNewTab: () => void;
  onRenameTab?: (id: string) => void;
}

export function TabStrip({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseAllTabs,
  onNewTab,
  onRenameTab,
}: TabStripProps) {
  const tabButtons = useRef(new Map<string, HTMLButtonElement>());

  // Arrow keys, Home and End move between tabs and open the one they land on
  // (the "automatic activation" pattern from the ARIA tabs guidance).
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((tab) => tab.id === (event.target as HTMLElement).dataset.tabId);
    if (current === -1) return;

    const last = tabs.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;

    event.preventDefault();
    const id = tabs[next].id;
    tabButtons.current.get(id)?.focus();
    onSelectTab(id);
  };

  return (
    <div data-tour="tabs" className="tab-strip flex min-w-0 flex-1 items-center gap-1">
      <div
        role="tablist"
        aria-label="Open documents"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className="flex min-w-0 items-center gap-1 overflow-x-auto py-1 [scrollbar-width:none]"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const title = getDisplayFileName(tab.filePath);

          return (
            <ContextMenu key={tab.id}>
              <ContextMenuTrigger asChild>
                <div
                  data-tab-item="true"
                  data-active={isActive}
                  onDoubleClick={() => onRenameTab?.(tab.id)}
                  className={cn(
                    "group relative flex h-8 max-w-56 min-w-0 shrink-0 items-center rounded-md text-sm transition-colors pointer-coarse:h-11",
                    isActive
                      ? "bg-accent text-accent-foreground after:absolute after:inset-x-2 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-linear-to-r after:from-brand-from after:to-brand-to"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <button
                    ref={(element) => {
                      if (element) tabButtons.current.set(tab.id, element);
                      else tabButtons.current.delete(tab.id);
                    }}
                    type="button"
                    role="tab"
                    data-tab-id={tab.id}
                    aria-selected={isActive}
                    // Starts with the visible text, so the name still matches what sighted users read.
                    aria-label={tab.isDirty ? `${title} (unsaved)` : undefined}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onSelectTab(tab.id)}
                    className="h-full min-w-0 flex-1 cursor-pointer truncate rounded-md pr-1 pl-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="truncate">{title}</span>
                    {tab.isDirty ? (
                      <span aria-hidden="true" className="ml-2 inline-block size-1.5 rounded-full bg-primary align-middle" />
                    ) : null}
                  </button>
                  {/* Hidden until the tab is hovered, focused or active, but always there on touch
                      screens, where there is no hover. */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Close ${title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className={cn(
                      "mr-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
                      isActive && "opacity-100",
                    )}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onSelect={() => onRenameTab?.(tab.id)}>Rename</ContextMenuItem>
                <ContextMenuItem onSelect={() => onCloseTab(tab.id)}>Close tab</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="New tab" className="tab-strip__new-tab" onClick={onNewTab}>
            <Plus aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New tab</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Tab actions" className="tab-strip__actions">
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={onCloseAllTabs}>Close all tabs</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
