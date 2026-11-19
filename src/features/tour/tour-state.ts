import { isTourUnseen, type MarkoraSettings } from "../settings/settings-schema";

/** One Tour stop: the area it points at (a `data-tour` anchor) and what it says. */
export interface TourStop {
  target: string;
  title: string;
  content: string;
}

export const TOUR_STOPS: TourStop[] = [
  {
    target: '[data-tour="view-mode"]',
    title: "Choose how you write",
    content:
      "Live renders as you type, Edit shows raw markdown, Split shows both, and Preview shows the result.",
  },
];

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
