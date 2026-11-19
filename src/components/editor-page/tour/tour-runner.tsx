import { Joyride, type EventData } from "react-joyride";
import { useEffect } from "react";
import { captureLayout, restoreLayout, stageStop } from "../../../features/tour/tour-layout";
import { isTourEnded, TOUR_STOPS, type TourEvent } from "../../../features/tour/tour-state";
import { TourTooltip } from "./tour-tooltip";

const steps = TOUR_STOPS.map((stop) => ({
  target: stop.target,
  title: stop.title,
  content: stop.content,
  // Open the stop's panel (if any) before the step looks for its target.
  before: async () => stageStop(stop),
  placement: stop.panel ? ("right" as const) : ("bottom" as const),
  // The tour is a guided look, not a gate: the switcher stays usable under the spotlight.
  blockTargetInteraction: false,
}));

interface TourRunnerProps {
  onEnd: (event: Extract<TourEvent, "skip" | "finish">) => void;
}

/** Runs the Tour with react-joyride. Loaded lazily by `Tour`; keep joyride imports in here. */
export default function TourRunner({ onEnd }: TourRunnerProps) {
  // Put the user's panel layout back however the tour ends: finish, skip or close (which unmounts us).
  useEffect(() => {
    const layout = captureLayout();
    return () => restoreLayout(layout);
  }, []);

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
      options={{ zIndex: 60, arrowColor: "var(--popover)", overlayColor: "rgba(0, 0, 0, 0.45)" }}
    />
  );
}
