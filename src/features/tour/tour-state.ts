import type { MarkoraPlatform } from "../../platform/runtime";
import { isTourUnseen, type MarkoraSettings } from "../settings/settings-schema";

/** One Tour stop: the area it points at (a `data-tour` anchor) and what it says. */
export interface TourStop {
  target: string;
  title: string;
  content: string;
  /** Platforms the stop is shown on; omitted means every platform. */
  platforms?: MarkoraPlatform[];
  /** A panel that must be open for this stop; the Tour opens it and restores the layout afterwards. */
  panel?: "outline";
}

export const TOUR_STOPS: TourStop[] = [
  {
    target: '[data-tour="view-mode"]',
    title: "Choose how you write",
    content:
      "Live renders as you type, Edit shows raw markdown, Split shows both, and Preview shows the result.",
  },
  {
    target: '[data-tour="formatting-bar"]',
    title: "Format without memorising markdown",
    content:
      "Use these buttons to add headings, lists, links and more. You can also type / in the editor to open a menu of blocks.",
  },
  {
    target: '[data-tour="command-palette"]',
    title: "Find any command",
    content:
      "Press Ctrl+K (Cmd+K on Mac) to search every command, the same ones as in these menus, and run it with Enter.",
  },
  {
    target: '[data-tour="outline"]',
    title: "Jump around with the outline",
    content: "The outline lists your headings. Click one to jump straight to that section.",
    panel: "outline",
  },
  {
    target: '[data-tour="theme"]',
    title: "Make it yours",
    content:
      "Switch between light and dark here. Open Settings from the menus or the command palette for colour schemes, zoom and more.",
  },
  {
    target: '[data-tour="tabs"]',
    title: "Keep several notes open",
    content: "Each document gets a tab. Use + to start a new one and the x on a tab to close it.",
  },
];

/** The stops that apply on a platform, in order. */
export function stopsForPlatform(stops: TourStop[], platform: MarkoraPlatform): TourStop[] {
  return stops.filter((stop) => !stop.platforms || stop.platforms.includes(platform));
}

export interface TourState {
  running: boolean;
}

export type TourEvent = "accept" | "skip" | "finish";

export const initialTourState: TourState = { running: false };

/** The Tour prompt is for unseen users only, and never over a tour that is already running. */
export function shouldOfferTour(settings: MarkoraSettings, state: TourState): boolean {
  return isTourUnseen(settings) && !state.running;
}

/**
 * Accepting starts the tour; skipping or finishing ends it. Ending either way records the
 * Tour version, so the user is not offered the tour again.
 */
export function tourReducer(
  state: TourState,
  event: TourEvent,
): { state: TourState; recordVersion: boolean } {
  if (event === "accept") return { state: { ...state, running: true }, recordVersion: false };
  return { state: { ...state, running: false }, recordVersion: true };
}

/** True for the status the tour library reports when the tour ends, by finishing, skipping or closing. */
export function isTourEnded(status: string): boolean {
  return status === "finished" || status === "skipped";
}
