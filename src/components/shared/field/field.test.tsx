import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "./field";

describe("Field", () => {
  it("renders label, helper text, and message around a control", () => {
    render(
      <Field label="Theme mode" helper="System follows your OS color scheme." message="Saved">
        <select id="theme-mode">
          <option value="system">System</option>
        </select>
      </Field>,
    );

    expect(screen.getByLabelText("Theme mode")).toBeInTheDocument();
    expect(screen.getByText("System follows your OS color scheme.")).toHaveClass(
      "text-app-text-muted",
    );
    expect(screen.getByText("Saved")).toHaveClass("text-app-text-secondary");
  });
});
