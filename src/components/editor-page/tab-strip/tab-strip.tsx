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
    <div className="flex items-center gap-2 border-b border-[color:var(--ghost-border)] bg-app-panel px-2 py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" role="tablist" aria-label="Open documents">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const title = getDisplayFileName(tab.filePath);

          return (
            <div
              key={tab.id}
              className={`group inline-flex min-w-0 items-center gap-2 rounded-t-[var(--radius-md)] border px-3 py-1.5 text-sm ${
                isActive
                  ? "border-[color:var(--ghost-border)] bg-app-panel-strong text-app-text"
                  : "border-transparent bg-transparent text-app-text-secondary hover:bg-app-panel-strong/60"
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className="truncate focus-visible:outline-none"
                onClick={() => onSelectTab(tab.id)}
              >
                {title}
                {tab.isDirty ? " *" : ""}
              </button>
              <button
                type="button"
                aria-label={`Close ${title}`}
                className="text-app-text-muted opacity-70 transition hover:opacity-100 focus-visible:outline-none"
                onClick={() => onCloseTab(tab.id)}
              >
                x
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="New tab"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-app-panel-strong text-app-text shadow-[var(--shadow-crisp)] focus-visible:outline-none"
        onClick={onNewTab}
      >
        +
      </button>
    </div>
  );
}
