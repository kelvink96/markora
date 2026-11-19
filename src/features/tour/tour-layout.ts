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

/** Below the `md` breakpoint the outline floats over the editor at full height, with no room beside it. */
export const NARROW_VIEWPORT_QUERY = "(max-width: 767px)";

export function isNarrowViewport(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(NARROW_VIEWPORT_QUERY).matches;
}

/** CSS transitions are already cut by the global reduced-motion rule; the library's scroll is script-driven. */
export function scrollDurationFor(): number | undefined {
  const reduced =
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduced ? 0 : undefined;
}

/** Where a stop's tooltip sits: beside a panel, under a toolbar area, or centred when a panel fills the screen. */
export function placementFor(stop: TourStop, narrow: boolean): "right" | "bottom" | "center" {
  if (!stop.panel) return "bottom";
  return narrow ? "center" : "right";
}

export function restoreLayout(layout: TourLayout): void {
  const workspace = useWorkspaceState.getState();
  if (workspace.showOutline !== layout.showOutline) workspace.toggleOutline();
}
