import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TourPrompt } from "./tour-prompt";

describe("TourPrompt", () => {
  it("is hidden until asked for", () => {
    render(<TourPrompt open={false} onSkip={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("invites the user to take a quick tour", () => {
    render(<TourPrompt open onSkip={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Take a quick tour?" })).toBeInTheDocument();
  });

  it("skips when Skip is pressed", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<TourPrompt open onSkip={onSkip} />);

    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("counts Escape as a skip so the prompt never returns", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<TourPrompt open onSkip={onSkip} />);

    await user.keyboard("{Escape}");

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("offers to start the tour only when a start handler is wired", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const { rerender } = render(<TourPrompt open onSkip={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Start tour" })).not.toBeInTheDocument();

    rerender(<TourPrompt open onSkip={vi.fn()} onStart={onStart} />);
    await user.click(screen.getByRole("button", { name: "Start tour" }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
