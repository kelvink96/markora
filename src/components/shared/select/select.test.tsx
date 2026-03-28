import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Select } from "./select";

describe("Select", () => {
  it("renders a labeled custom select that opens styled items and updates selection", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    function SelectHarness() {
      const [value, setValue] = useState("system");

      return (
        <Select
          label="Theme mode"
          helper="Choose how the app should pick a theme."
          message="Theme updates apply immediately."
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            handleChange(event.target.value);
          }}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>
      );
    }

    render(<SelectHarness />);

    const trigger = screen.getByRole("button", { name: "Theme mode" });
    expect(trigger).toHaveTextContent("System");

    await user.click(trigger);

    expect(screen.getByRole("menu")).toHaveClass("app-flyout-solid");
    expect(screen.getByRole("menuitemradio", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByText("Choose how the app should pick a theme.")).toBeInTheDocument();
    expect(screen.getByText("Theme updates apply immediately.")).toBeInTheDocument();
    expect(screen.getByTestId("select-chevron")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitemradio", { name: "Light" }));

    expect(handleChange).toHaveBeenCalledWith("light");
    expect(screen.getByRole("button", { name: "Theme mode" })).toHaveTextContent("Light");
  });
});
