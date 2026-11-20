import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SwatchGroup } from "./swatches";

function renderGroup(onValueChange = vi.fn()) {
  render(
    <SwatchGroup<"light" | "dark">
      label="Theme mode"
      testIdPrefix="theme-swatch"
      value="light"
      onValueChange={onValueChange}
      options={[
        { value: "light", title: "Light", description: "Bright", preview: <div>light preview</div>, attributes: { "data-theme": "light" } },
        { value: "dark", title: "Dark", description: "Dim", preview: <div>dark preview</div> },
      ]}
    />,
  );
  return onValueChange;
}

describe("SwatchGroup", () => {
  it("is a radio group built from the app's RadioGroup", () => {
    renderGroup();

    const group = screen.getByRole("radiogroup", { name: "Theme mode" });
    expect(group).toHaveAttribute("data-slot", "radio-group");
    const light = screen.getByRole("radio", { name: /Light/ });
    expect(light).toHaveAttribute("data-slot", "radio-group-item");
    expect(light).toBeChecked();
    expect(screen.getByTestId("theme-swatch-light")).toBe(light);
    expect(light).toHaveAttribute("data-theme", "light");
  });

  it("selects an option when anywhere on its card is clicked", async () => {
    const onValueChange = renderGroup();

    await userEvent.click(screen.getByText("dark preview"));

    expect(onValueChange).toHaveBeenCalledWith("dark");
  });
});
