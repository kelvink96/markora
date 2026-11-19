import { Joyride, type EventData } from "react-joyride";
import { useEffect, useState } from "react";
import {
  captureLayout,
  isNarrowViewport,
  placementFor,
  restoreLayout,
  scrollDurationFor,
  stageStop,
} from "../../../features/tour/tour-layout";
import { detectPlatform } from "../../../platform/runtime";
import { isTourEnded, stopsForPlatform, TOUR_STOPS, type TourEvent } from "../../../features/tour/tour-state";
import { TourTooltip } from "./tour-tooltip";

const buildSteps = (narrow: boolean) => stopsForPlatform(TOUR_STOPS, detectPlatform()).map((stop) => ({
  target: stop.target,
  title: stop.title,
  content: stop.content,
  // Open the stop's panel (if any) before the step looks for its target.
  before: async () => stageStop(stop),
  placement: placementFor(stop, narrow),
  // The tour is a guided look, not a gate: the switcher stays usable under the spotlight.
  blockTargetInteraction: false,
}));

/**
 * The tooltip held focus while the tour ran, so when it goes the page would be left with none.
 * Hand it back to the editor, where the user was working. Focus the user has moved elsewhere
 * on purpose is left alone.
 */
function returnFocus() {
  const active = document.activeElement;
  const lost = !active || active === document.body || active.closest('[role="alertdialog"]');
  if (lost) document.querySelector<HTMLElement>(".cm-content")?.focus();
}

interface TourRunnerProps {
  onEnd: (event: Extract<TourEvent, "skip" | "finish">) => void;
}

/** Runs the Tour with react-joyride. Loaded lazily by `Tour`; keep joyride imports in here. */
export default function TourRunner({ onEnd }: TourRunnerProps) {
  // Fixed for the run: resizing mid-tour would only make the tooltip jump.
  const [steps] = useState(() => buildSteps(isNarrowViewport()));
  const [scrollDuration] = useState(scrollDurationFor);

  // Put the user's panel layout back however the tour ends: finish, skip or close (which unmounts us).
  useEffect(() => {
    const layout = captureLayout();
    return () => {
      restoreLayout(layout);
      returnFocus();
    };
  }, []);

  // Escape ends the tour, the same as the close button.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) onEnd("skip");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onEnd]);

  const handleEvent = ({ status }: EventData) => {
    if (isTourEnded(status)) onEnd(status === "skipped" ? "skip" : "finish");
  };

  return (
    <Joyride
      run
      continuous
      steps={steps}
      tooltipComponent={TourTooltip}
      onEvent={handleEvent}
      options={{
        zIndex: 60,
        arrowColor: "var(--popover)",
        overlayColor: "rgba(0, 0, 0, 0.45)",
        // Open straight onto the tooltip rather than a pulsing beacon to click first.
        skipBeacon: true,
        // The library's defaults only close the current step (the tour moves on). In this tour the
        // close button ends it, and a stray click on the dimmed page does nothing.
        closeButtonAction: "skip",
        overlayClickAction: false,
        // Escape is handled above, so it ends the tour like the close button.
        dismissKeyAction: false,
        scrollDuration,
      }}
    />
  );
}
