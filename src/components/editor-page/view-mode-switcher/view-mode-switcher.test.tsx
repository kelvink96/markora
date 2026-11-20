import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewModeSwitcher } from "./view-mode-switcher";

describe("ViewModeSwitcher", () => {
  it("offers write, side-by-side and read as one labelled choice, with the current one selected", () => {
    render(<ViewModeSwitcher value="split" onValueChange={vi.fn()} />);

    expect(screen.getByRole("radiogroup", { name: "View mode" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("aria-label"))).toEqual([
      "Write view",
      "Side-by-side view",
      "Read view",
    ]);
    expect(screen.getByRole("radio", { name: "Write view" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Side-by-side view" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Read view" })).not.toBeChecked();
  });

  it("shows each view's name as text, not just an icon", () => {
    render(<ViewModeSwitcher value="write" onValueChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "Write view" })).toHaveTextContent("Write");
    expect(screen.getByRole("radio", { name: "Side-by-side view" })).toHaveTextContent("Side-by-side");
    expect(screen.getByRole("radio", { name: "Read view" })).toHaveTextContent("Read");
  });

  it("is the anchor of the view-mode Tour stop", () => {
    render(<ViewModeSwitcher value="write" onValueChange={vi.fn()} />);

    expect(screen.getByRole("radiogroup", { name: "View mode" })).toHaveAttribute("data-tour", "view-mode");
  });

  it("changes modes when clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ViewModeSwitcher value="write" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("radio", { name: "Read view" }));
    await user.click(screen.getByRole("radio", { name: "Side-by-side view" }));

    expect(onValueChange).toHaveBeenNthCalledWith(1, "read");
    expect(onValueChange).toHaveBeenNthCalledWith(2, "split");
  });

  it("never ends up with no view: clicking the selected one again does nothing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ViewModeSwitcher value="split" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("radio", { name: "Side-by-side view" }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("moves between modes with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<ViewModeSwitcher value="write" onValueChange={vi.fn()} />);

    await user.tab();
    expect(screen.getByRole("radio", { name: "Write view" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Side-by-side view" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Write view" })).toHaveFocus();
  });

  it("shows a tooltip naming the mode, for when the label is hidden on a narrow screen", async () => {
    const user = userEvent.setup();
    render(<ViewModeSwitcher value="split" onValueChange={vi.fn()} />);

    await user.hover(screen.getByRole("radio", { name: "Read view" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Read");
  });
});
