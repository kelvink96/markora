import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "./select";

describe("Select", () => {
  it("renders a labeled native select control", () => {
    render(
      <Select label="Theme mode" defaultValue="system">
        <option value="system">System</option>
        <option value="light">Light</option>
      </Select>,
    );

    const select = screen.getByLabelText("Theme mode");
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveClass("rounded-app-sm", "bg-[color:var(--glass-elevated)]");
  });
});
