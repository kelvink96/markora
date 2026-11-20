import { BookOpen, Columns2, PencilLine, type LucideIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";

interface ViewModeSwitcherProps {
  value: WorkspaceViewMode;
  onValueChange: (mode: WorkspaceViewMode) => void;
}

const modes: Array<{ value: WorkspaceViewMode; label: string; ariaLabel: string; icon: LucideIcon }> = [
  { value: "write", label: "Write", ariaLabel: "Write view", icon: PencilLine },
  { value: "split", label: "Side-by-side", ariaLabel: "Side-by-side view", icon: Columns2 },
  { value: "read", label: "Read", ariaLabel: "Read view", icon: BookOpen },
];

export function ViewModeSwitcher({ value, onValueChange }: ViewModeSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="View mode"
      data-tour="view-mode"
      value={value}
      // Clicking the selected item would clear a single-select group; a view is always chosen.
      onValueChange={(next) => next && onValueChange(next as WorkspaceViewMode)}
    >
      {modes.map(({ value: mode, label, ariaLabel, icon: Icon }) => (
        <Tooltip key={mode}>
          <TooltipTrigger asChild>
            <ToggleGroupItem value={mode} aria-label={ariaLabel} className="gap-1.5">
              <Icon aria-hidden="true" />
              {/* Text names the view from md up; below that the icon and the tooltip carry it. */}
              <span className="max-md:hidden">{label}</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
