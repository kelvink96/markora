import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";
import { SegmentedControl } from "../../shared/segmented-control";

interface ViewModeSwitcherProps {
  value: WorkspaceViewMode;
  onValueChange: (mode: WorkspaceViewMode) => void;
}

const modes: WorkspaceViewMode[] = ["edit", "split", "preview"];

export function ViewModeSwitcher({ value, onValueChange }: ViewModeSwitcherProps) {
  return (
    <SegmentedControl
      ariaLabel="View mode"
      options={modes.map((mode) => ({
        label: mode.charAt(0).toUpperCase() + mode.slice(1),
        value: mode,
      }))}
      value={value}
      onValueChange={onValueChange}
    />
  );
}
