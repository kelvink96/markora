import { useWorkspaceState } from "../workspace/workspace-state";
import type { TourStop } from "./tour-state";

/** The panel layout the user had before the Tour, so it can be put back when the Tour ends. */
export interface TourLayout {
  showOutline: boolean;
}

export function captureLayout(): TourLayout {
  return { showOutline: useWorkspaceState.getState().showOutline };
}

/** Opens the panel a stop points at if it is closed; stops without a panel leave the layout alone. */
export function stageStop(stop: TourStop): void {
  const workspace = useWorkspaceState.getState();
  if (stop.panel === "outline" && !workspace.showOutline) workspace.toggleOutline();
}

export function restoreLayout(layout: TourLayout): void {
  const workspace = useWorkspaceState.getState();
  if (workspace.showOutline !== layout.showOutline) workspace.toggleOutline();
}
