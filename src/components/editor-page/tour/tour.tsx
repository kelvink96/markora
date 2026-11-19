import { lazy, Suspense } from "react";
import type { TourEvent } from "../../../features/tour/tour-state";

// react-joyride is only fetched when a tour starts, so it stays out of the startup bundle.
const TourRunner = lazy(() => import("./tour-runner"));

interface TourProps {
  run: boolean;
  onEnd: (event: Extract<TourEvent, "skip" | "finish">) => void;
}

export function Tour({ run, onEnd }: TourProps) {
  if (!run) return null;
  return (
    <Suspense fallback={null}>
      <TourRunner onEnd={onEnd} />
    </Suspense>
  );
}
