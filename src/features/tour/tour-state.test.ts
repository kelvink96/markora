import { describe, expect, it } from "vitest";
import { createDefaultSettings } from "../settings/settings-schema";
import { initialTourState, isTourEnded, shouldOfferTour, tourReducer, TOUR_STOPS } from "./tour-state";

describe("shouldOfferTour", () => {
  it("offers the prompt to an unseen user who is not already touring", () => {
    expect(shouldOfferTour(createDefaultSettings(), initialTourState)).toBe(true);
  });

  it("does not offer it once the current Tour version is recorded", () => {
    const settings = createDefaultSettings();
    settings.onboarding.tourVersion = 1;
    expect(shouldOfferTour(settings, initialTourState)).toBe(false);
  });

  it("does not offer it again while the tour is running", () => {
    const running = tourReducer(initialTourState, "accept").state;
    expect(shouldOfferTour(createDefaultSettings(), running)).toBe(false);
  });
});

describe("tourReducer", () => {
  it("runs the tour on accept without recording a version yet", () => {
    expect(tourReducer(initialTourState, "accept")).toEqual({
      state: { running: true },
      recordVersion: false,
    });
  });

  it("stops and records the version on skip", () => {
    expect(tourReducer({ running: false }, "skip")).toEqual({
      state: { running: false },
      recordVersion: true,
    });
  });

  it("stops and records the version on finish", () => {
    expect(tourReducer({ running: true }, "finish")).toEqual({
      state: { running: false },
      recordVersion: true,
    });
  });
});

describe("isTourEnded", () => {
  it("treats finished and skipped as the end, from a close too", () => {
    expect(isTourEnded("finished")).toBe(true);
    expect(isTourEnded("skipped")).toBe(true);
    expect(isTourEnded("running")).toBe(false);
  });
});

describe("TOUR_STOPS", () => {
  it("starts with the view-mode switcher", () => {
    expect(TOUR_STOPS[0]).toMatchObject({ target: '[data-tour="view-mode"]' });
    expect(TOUR_STOPS[0].title).toBeTruthy();
  });
});
