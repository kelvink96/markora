import { Eye, FileInput, PanelsTopLeft, type LucideIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";

interface ViewModeSwitcherProps {
  value: WorkspaceViewMode;
  onValueChange: (mode: WorkspaceViewMode) => void;
}

const modes: Array<{ value: WorkspaceViewMode; label: string; ariaLabel: string; icon: LucideIcon }> = [
  { value: "edit", label: "Edit", ariaLabel: "Edit view", icon: FileInput },
  { value: "split", label: "Split", ariaLabel: "Split view", icon: PanelsTopLeft },
  { value: "preview", label: "Preview", ariaLabel: "Preview view", icon: Eye },
];

export function ViewModeSwitcher({ value, onValueChange }: ViewModeSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="View mode"
      value={value}
      // Clicking the selected item would clear a single-select group; a view is always chosen.
      onValueChange={(next) => next && onValueChange(next as WorkspaceViewMode)}
    >
      {modes.map(({ value: mode, label, ariaLabel, icon: Icon }) => (
        <Tooltip key={mode}>
          <TooltipTrigger asChild>
            <ToggleGroupItem value={mode} aria-label={ariaLabel}>
              <Icon aria-hidden="true" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
