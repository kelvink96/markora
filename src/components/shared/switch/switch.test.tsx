import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders a distinct themed switch control and preserves disabled state", async () => {
    const user = userEvent.setup();

    const { rerender } = render(<Switch label="Live preview" />);

    const control = screen.getByRole("switch", { name: "Live preview" });
    expect(control).toHaveAttribute("data-state", "unchecked");
    expect(screen.getByTestId("switch-track")).toBeInTheDocument();
    expect(screen.getByTestId("switch-thumb")).toBeInTheDocument();

    await user.click(control);

    expect(control).toHaveAttribute("data-state", "checked");

    rerender(<Switch label="Live preview" disabled checked />);

    expect(screen.getByRole("switch", { name: "Live preview" })).toBeDisabled();
  });
});
