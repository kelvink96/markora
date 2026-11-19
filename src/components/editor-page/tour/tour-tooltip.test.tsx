import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TooltipRenderProps } from "react-joyride";
import { TourTooltip } from "./tour-tooltip";

const buttonProps = (action: string, onClick = vi.fn()) => ({
  "aria-label": action,
  "data-action": action,
  onClick,
  role: "button",
  title: action,
});

function renderTooltip(overrides: { isLastStep?: boolean; index?: number } = {}) {
  const handlers = { back: vi.fn(), close: vi.fn(), primary: vi.fn(), skip: vi.fn() };
  render(
    <TourTooltip
      {...({
        index: overrides.index ?? 0,
        isLastStep: overrides.isLastStep ?? false,
        size: 3,
        step: { title: "Choose how you write", content: "Pick a view." },
        backProps: buttonProps("back", handlers.back),
        closeProps: buttonProps("close", handlers.close),
        primaryProps: buttonProps("primary", handlers.primary),
        skipProps: buttonProps("skip", handlers.skip),
        tooltipProps: { "aria-modal": true, role: "alertdialog", tabIndex: 0 },
      } as unknown as TooltipRenderProps)}
    />,
  );
  return handlers;
}

describe("TourTooltip", () => {
  it("shows the stop's title, content and position", () => {
    renderTooltip();

    expect(screen.getByText("Choose how you write")).toBeInTheDocument();
    expect(screen.getByText("Pick a view.")).toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("offers Next and Skip on the first stop, with no Back", async () => {
    const user = userEvent.setup();
    const handlers = renderTooltip();

    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Skip tour" }));

    expect(handlers.primary).toHaveBeenCalledTimes(1);
    expect(handlers.skip).toHaveBeenCalledTimes(1);
  });

  it("offers Back after the first stop and Finish on the last", async () => {
    const user = userEvent.setup();
    const handlers = renderTooltip({ index: 2, isLastStep: true });

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(handlers.back).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip tour" })).not.toBeInTheDocument();
  });

  it("can be closed", async () => {
    const user = userEvent.setup();
    const handlers = renderTooltip();

    await user.click(screen.getByRole("button", { name: "Close tour" }));

    expect(handlers.close).toHaveBeenCalledTimes(1);
  });
});
