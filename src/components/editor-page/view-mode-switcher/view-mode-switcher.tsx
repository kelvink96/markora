import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";

interface ViewModeSwitcherProps {
  value: WorkspaceViewMode;
  onValueChange: (mode: WorkspaceViewMode) => void;
}

const modes: WorkspaceViewMode[] = ["edit", "split", "preview"];

export function ViewModeSwitcher({ value, onValueChange }: ViewModeSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="inline-flex items-center rounded-full border border-[color:var(--ghost-border)] bg-app-panel-strong/82 p-0.5 shadow-[var(--shadow-crisp)]"
    >
      {modes.map((mode) => {
        const selected = value === mode;

        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={mode.charAt(0).toUpperCase() + mode.slice(1)}
            className={`rounded-full px-3 py-1.5 text-[0.85rem] font-medium capitalize transition ${
              selected
                ? "bg-app-panel text-app-text"
                : "text-app-text-secondary hover:bg-app-subtle"
            }`}
            onClick={() => onValueChange(mode)}
          >
            {mode}
          </button>
        );
      })}
    </div>
  );
}
