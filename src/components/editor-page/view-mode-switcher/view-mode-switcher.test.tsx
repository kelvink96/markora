import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewModeSwitcher } from "./view-mode-switcher";

describe("ViewModeSwitcher", () => {
  it("offers live, edit, split and preview as one labelled choice, with the current one selected", () => {
    render(<ViewModeSwitcher value="split" onValueChange={vi.fn()} />);

    expect(screen.getByRole("radiogroup", { name: "View mode" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("aria-label"))).toEqual([
      "Live view",
      "Edit view",
      "Split view",
      "Preview view",
    ]);
    expect(screen.getByRole("radio", { name: "Live view" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Split view" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Edit view" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Preview view" })).not.toBeChecked();
  });

  it("is the anchor of the view-mode Tour stop", () => {
    render(<ViewModeSwitcher value="live" onValueChange={vi.fn()} />);

    expect(screen.getByRole("radiogroup", { name: "View mode" })).toHaveAttribute("data-tour", "view-mode");
  });

  it("changes modes when clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ViewModeSwitcher value="edit" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("radio", { name: "Preview view" }));

    expect(onValueChange).toHaveBeenCalledWith("preview");
  });

  it("never ends up with no view: clicking the selected one again does nothing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ViewModeSwitcher value="split" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("radio", { name: "Split view" }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("moves between modes with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<ViewModeSwitcher value="edit" onValueChange={vi.fn()} />);

    await user.tab();
    expect(screen.getByRole("radio", { name: "Edit view" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Split view" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Live view" })).toHaveFocus();
  });

  it("shows a tooltip naming the live mode", async () => {
    const user = userEvent.setup();
    render(<ViewModeSwitcher value="edit" onValueChange={vi.fn()} />);

    await user.hover(screen.getByRole("radio", { name: "Live view" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Live");
  });
});
