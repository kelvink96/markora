import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders a distinct switch control", async () => {
    const user = userEvent.setup();

    render(<Switch label="Live preview" />);

    const control = screen.getByRole("switch", { name: "Live preview" });
    expect(control).toHaveAttribute("data-state", "unchecked");

    await user.click(control);

    expect(control).toHaveAttribute("data-state", "checked");
  });
});
