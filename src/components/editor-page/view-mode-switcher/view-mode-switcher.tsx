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
      className="inline-flex items-center rounded-app-lg border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] p-0.5 backdrop-blur-[var(--glass-blur-soft)] shadow-[var(--shadow-crisp)]"
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
            className={`rounded-app-md px-3 py-1.5 text-[0.85rem] font-medium capitalize transition ${
              selected
                ? "bg-[color:var(--glass-elevated)] text-app-text"
                : "text-app-text-secondary hover:bg-[color:var(--glass-hover)]"
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
