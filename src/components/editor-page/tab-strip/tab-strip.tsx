import { Plus, X } from "lucide-react";
import { getDisplayFileName } from "../../../features/document/document-actions";
import type { DocumentTab } from "../../../store/document";

interface TabStripProps {
  tabs: DocumentTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
}

export function TabStrip({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}: TabStripProps) {
  return (
    <div className="flex items-center gap-2 border-b border-[color:var(--ghost-border)] bg-app-panel/96 px-2 py-1">
      <div
        className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto"
        role="tablist"
        aria-label="Open documents"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const title = getDisplayFileName(tab.filePath);

          return (
            <div
              key={tab.id}
              className={`group inline-flex min-w-0 items-center gap-1.5 rounded-t-[12px border px-3 py-1.5 text-[0.82rem] ${
                isActive
                  ? "border-[color:var(--ghost-border)] border-b-app-panel bg-app-panel-strong text-app-text shadow-[var(--shadow-ambient)]"
                  : "border-transparent bg-transparent text-app-text-secondary hover:bg-app-panel-strong/55"
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className="truncate font-medium focus-visible:outline-none"
                onClick={() => onSelectTab(tab.id)}
              >
                {title}
                {tab.isDirty ? " *" : ""}
              </button>
              <button
                type="button"
                aria-label={`Close ${title}`}
                className="inline-flex size-5 items-center justify-center rounded-full text-app-text-muted opacity-0 transition hover:bg-app-subtle hover:text-app-text hover:opacity-100 focus-visible:outline-none group-hover:opacity-80"
                onClick={() => onCloseTab(tab.id)}
              >
                <X size={14} strokeWidth={2.1} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="New tab"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-transparent text-app-text-secondary transition hover:bg-app-panel-strong hover:text-app-text focus-visible:outline-none"
        onClick={onNewTab}
      >
        <Plus size={16} strokeWidth={2.1} aria-hidden="true" />
      </button>
    </div>
  );
}
