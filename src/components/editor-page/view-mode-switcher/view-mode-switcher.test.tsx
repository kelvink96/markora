import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewModeSwitcher } from "./view-mode-switcher";

describe("ViewModeSwitcher", () => {
  it("offers edit, split and preview as one labelled choice, with the current one selected", () => {
    render(<ViewModeSwitcher value="split" onValueChange={vi.fn()} />);

    expect(screen.getByRole("radiogroup", { name: "View mode" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Split view" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Edit view" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Preview view" })).not.toBeChecked();
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
  });
});
