import type { ReactNode } from "react";
import { Eye, FileInput, PanelsTopLeft } from "lucide-react";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";
import { SegmentedControl } from "../../shared/segmented-control";

interface ViewModeSwitcherProps {
  value: WorkspaceViewMode;
  onValueChange: (mode: WorkspaceViewMode) => void;
}

const modes: Array<{
  ariaLabel: string;
  icon: ReactNode;
  label: string;
  value: WorkspaceViewMode;
}> = [
  { value: "edit", label: "Edit", ariaLabel: "Edit view", icon: <FileInput className="size-4" aria-hidden="true" /> },
  { value: "split", label: "Split", ariaLabel: "Split view", icon: <PanelsTopLeft className="size-4" aria-hidden="true" /> },
  { value: "preview", label: "Preview", ariaLabel: "Preview view", icon: <Eye className="size-4" aria-hidden="true" /> },
];

export function ViewModeSwitcher({ value, onValueChange }: ViewModeSwitcherProps) {
  return (
    <SegmentedControl
      ariaLabel="View mode"
      options={modes}
      value={value}
      onValueChange={onValueChange}
    />
  );
}
