import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "./select";

describe("Select", () => {
  it("renders a labeled native select control with helper text, message text, and a chevron affordance", () => {
    render(
      <Select
        label="Theme mode"
        helper="Choose how the app should pick a theme."
        message="Theme updates apply immediately."
        defaultValue="system"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
      </Select>,
    );

    const select = screen.getByLabelText("Theme mode");
    expect(select.tagName).toBe("SELECT");
    expect(screen.getByText("Choose how the app should pick a theme.")).toBeInTheDocument();
    expect(screen.getByText("Theme updates apply immediately.")).toBeInTheDocument();
    expect(screen.getByTestId("select-chevron")).toBeInTheDocument();
  });
});
