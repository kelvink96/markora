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
    <div className="tab-strip flex items-center gap-2 border-b border-[color:var(--glass-border)] bg-[color:var(--glass-panel-strong)] px-2.5 py-1.5 backdrop-blur-[var(--glass-blur-strong)]">
      <div
        className="flex min-w-0 flex-1 items-end gap-1.5 overflow-x-auto"
        role="tablist"
        aria-label="Open documents"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const title = getDisplayFileName(tab.filePath);
          const tabClassName = isActive
            ? "tab-strip__tab tab-strip__tab--active border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] text-app-text shadow-[var(--tab-active-shadow)]"
            : "tab-strip__tab tab-strip__tab--inactive border-transparent bg-[color:var(--glass-panel)] text-app-text-secondary hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass-hover)] hover:text-app-text";

          return (
            <div
              key={tab.id}
              className={`group inline-flex min-w-0 items-center gap-1.5 rounded-app-sm border px-3.5 py-2 text-[0.82rem] backdrop-blur-lg transition-[background-color,border-color,color,box-shadow,transform] duration-150 ${tabClassName}`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className="truncate font-medium tracking-[-0.01em] focus-visible:outline-none"
                onClick={() => onSelectTab(tab.id)}
              >
                {title}
                {tab.isDirty ? " *" : ""}
              </button>
              <button
                type="button"
                aria-label={`Close ${title}`}
                className="inline-flex size-5 items-center justify-center rounded-full text-app-text-muted opacity-0 transition hover:bg-[color:var(--tab-close-hover)] hover:text-app-text hover:opacity-100 focus-visible:outline-none group-hover:opacity-80"
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
        className="tab-strip__new-tab inline-flex size-8 shrink-0 items-center justify-center rounded-app-md border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] text-app-text-secondary backdrop-blur-[var(--glass-blur-soft)] transition hover:bg-[color:var(--glass-hover)] hover:text-app-text focus-visible:outline-none"
        onClick={onNewTab}
      >
        <Plus size={16} strokeWidth={2.1} aria-hidden="true" />
      </button>
    </div>
  );
}
