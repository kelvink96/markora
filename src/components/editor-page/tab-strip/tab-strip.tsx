import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Ellipsis, Plus, X } from "lucide-react";
import { useState } from "react";
import { getDisplayFileName } from "../../../features/document/document-actions";
import type { DocumentTab } from "../../../store/document";
import { MenuContent, MenuItem, MenuTrigger } from "../../shared/menu";
import { Logo } from "../../shared/logo";
import { Tab } from "../../shared/tab";

interface TabStripProps {
  tabs: DocumentTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCloseAllTabs: () => void;
  onNewTab: () => void;
  onRenameTab?: (id: string) => void;
}

interface ContextMenuState {
  tabId: string | null;
  x: number;
  y: number;
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
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ tabId: null, x: 0, y: 0 });

  const handleContextMenu = (event: React.MouseEvent, tabId: string) => {
    event.preventDefault();
    setContextMenu({ tabId, x: event.clientX, y: event.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu({ tabId: null, x: 0, y: 0 });
  };

  const handleRename = () => {
    if (contextMenu.tabId && onRenameTab) {
      onRenameTab(contextMenu.tabId);
    }
    closeContextMenu();
  };

  const handleClose = () => {
    if (contextMenu.tabId) {
      onCloseTab(contextMenu.tabId);
    }
    closeContextMenu();
  };

  return (
    <div className="tab-strip flex items-center gap-2 bg-[color:var(--glass-panel-strong)] px-2.5 py-1.5 backdrop-blur-[var(--glass-blur-strong)]">
      <Logo size={24} showLabel />
      <div
        className="flex min-w-0 flex-1 items-end gap-1.5 overflow-x-auto"
        role="tablist"
        aria-label="Open documents"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const title = getDisplayFileName(tab.filePath);

          return (
            <Tab
              key={tab.id}
              ariaSelected={isActive}
              isActive={isActive}
              className="group tab-strip__tab min-w-0 backdrop-blur-lg duration-150"
              wrapperProps={{
                onContextMenu: (e) => handleContextMenu(e, tab.id),
                onDoubleClick: () => onRenameTab?.(tab.id),
              }}
              rightSection={
                <button
                  type="button"
                  aria-label={`Close ${title}`}
                  className="inline-flex size-5 items-center justify-center rounded-full text-app-text-muted opacity-0 transition-[background-color,color,opacity] hover:bg-[color:var(--tab-close-hover)] hover:text-app-text hover:opacity-100 focus-visible:outline-none group-hover:opacity-80"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                >
                  <X size={14} strokeWidth={2.1} aria-hidden="true" />
                </button>
              }
              onClick={() => onSelectTab(tab.id)}
            >
              {title}
              {tab.isDirty ? " *" : ""}
            </Tab>
          );
        })}
      </div>
      {contextMenu.tabId && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className="app-flyout-solid absolute z-50 w-40 p-1"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full rounded-app-sm px-2 py-1.5 text-left text-sm text-app-text transition-colors duration-150 hover:bg-[color:color-mix(in_srgb,var(--glass-panel-strong)_65%,var(--surface-subtle))] focus-visible:outline-none"
              onClick={handleRename}
            >
              Rename
            </button>
            <button
              className="w-full rounded-app-sm px-2 py-1.5 text-left text-sm text-app-text transition-colors duration-150 hover:bg-[color:color-mix(in_srgb,var(--glass-panel-strong)_65%,var(--surface-subtle))] focus-visible:outline-none"
              onClick={handleClose}
            >
              Close tab
            </button>
          </div>
        </>
      )}
      <DropdownMenu.Root>
        <MenuTrigger aria-label="Tab actions" className="tab-strip__actions inline-flex size-8 shrink-0 items-center justify-center px-0">
          <Ellipsis size={16} strokeWidth={2.1} aria-hidden="true" />
        </MenuTrigger>
        <MenuContent className="w-48">
          <MenuItem onSelect={onCloseAllTabs}>Close all tabs</MenuItem>
        </MenuContent>
      </DropdownMenu.Root>
      <button
        type="button"
        aria-label="New tab"
        className="tab-strip__new-tab inline-flex size-8 shrink-0 items-center justify-center rounded-app-md border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] text-app-text-secondary backdrop-blur-[var(--glass-blur-soft)] transition hover:bg-[color:var(--glass-hover)] hover:text-app-text focus-visible:outline-none"
        onClick={onNewTab}
      >
        <Plus size={16} strokeWidth={2.1} aria-hidden="true" />
      </button>
    </div>
  );
}
