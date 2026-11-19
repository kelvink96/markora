import { Joyride, type EventData } from "react-joyride";
import { isTourEnded, TOUR_STOPS, type TourEvent } from "../../../features/tour/tour-state";
import { TourTooltip } from "./tour-tooltip";

const steps = TOUR_STOPS.map(({ target, title, content }) => ({
  target,
  title,
  content,
  placement: "bottom" as const,
  // The tour is a guided look, not a gate: the switcher stays usable under the spotlight.
  blockTargetInteraction: false,
}));

interface TourRunnerProps {
  onEnd: (event: Extract<TourEvent, "skip" | "finish">) => void;
}

/** Runs the Tour with react-joyride. Loaded lazily by `Tour`; keep joyride imports in here. */
export default function TourRunner({ onEnd }: TourRunnerProps) {
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
