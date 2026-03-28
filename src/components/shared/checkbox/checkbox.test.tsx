import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders a labeled checkbox hit area", async () => {
    const user = userEvent.setup();

    render(<Checkbox label="Show status bar" />);

    const checkbox = screen.getByRole("checkbox", { name: "Show status bar" });
    await user.click(screen.getByText("Show status bar"));

    expect(checkbox).toBeChecked();
  });
});
