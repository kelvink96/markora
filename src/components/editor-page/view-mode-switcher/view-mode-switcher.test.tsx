import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewModeSwitcher } from "./view-mode-switcher";

describe("ViewModeSwitcher", () => {
  it("renders edit, split, and preview modes", () => {
    render(<ViewModeSwitcher value="edit" onValueChange={vi.fn()} />);

    expect(screen.getByRole("tablist", { name: "View mode" })).toHaveClass("rounded-app-sm");
    expect(screen.getByRole("tab", { name: "Edit" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Split" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Preview" })).toBeInTheDocument();
  });

  it("changes modes when clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ViewModeSwitcher value="edit" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("tab", { name: "Preview" }));

    expect(onValueChange).toHaveBeenCalledWith("preview");
  });
});
