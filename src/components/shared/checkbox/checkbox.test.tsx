import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders an accessible themed checkbox and preserves checked and disabled state", async () => {
    const user = userEvent.setup();

    const { rerender } = render(<Checkbox label="Show status bar" />);

    const checkbox = screen.getByRole("checkbox", { name: "Show status bar" });
    await user.click(screen.getByText("Show status bar"));

    expect(checkbox).toBeChecked();
    expect(screen.getByTestId("checkbox-control")).toBeInTheDocument();

    rerender(<Checkbox label="Show status bar" disabled checked />);

    expect(screen.getByRole("checkbox", { name: "Show status bar" })).toBeDisabled();
  });
});
