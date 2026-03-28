import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl } from "./segmented-control";

describe("SegmentedControl", () => {
  it("renders options with a selected value", () => {
    render(
      <SegmentedControl
        ariaLabel="View mode"
        options={[
          { label: "Edit", value: "edit" },
          { label: "Split", value: "split" },
          { label: "Preview", value: "preview" },
        ]}
        value="split"
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("tablist", { name: "View mode" })).toHaveClass("app-toolbar");
    expect(screen.getByRole("tab", { name: "Split" })).toHaveAttribute("aria-selected", "true");
  });

  it("calls onValueChange when a new option is clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <SegmentedControl
        ariaLabel="View mode"
        options={[
          { label: "Edit", value: "edit" },
          { label: "Split", value: "split" },
          { label: "Preview", value: "preview" },
        ]}
        value="edit"
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Preview" }));

    expect(onValueChange).toHaveBeenCalledWith("preview");
  });
});
