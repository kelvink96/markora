import { X } from "lucide-react";
import type { TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/ui/button";

/**
 * The Tour's tooltip, built from the app's own Button and theme tokens (popover, border,
 * muted-foreground) so it follows every colour scheme. The `*Props` from the tour library
 * carry the click handlers and data attributes it relies on, so they are spread as given.
 */
export function TourTooltip({
  index,
  size,
  isLastStep,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        {step.title ? <h2 className="text-sm font-semibold">{step.title}</h2> : <span />}
        <Button
          {...closeProps}
          variant="ghost"
          size="icon-sm"
          aria-label="Close tour"
          className="-mr-2 -mt-1"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{step.content}</div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {index + 1} of {size}
        </span>
        <div className="flex items-center gap-2">
          {isLastStep ? null : (
            <Button {...skipProps} variant="ghost" size="sm" aria-label="Skip tour">
              Skip
            </Button>
          )}
          {index > 0 ? (
            <Button {...backProps} variant="outline" size="sm" aria-label="Back">
              Back
            </Button>
          ) : null}
          <Button {...primaryProps} size="sm" aria-label={isLastStep ? "Finish" : "Next"}>
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
