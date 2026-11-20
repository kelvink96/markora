import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingRow } from "./settings-page-shared";

describe("SettingRow", () => {
  // The dot alone is 8px across, far too small to hit, especially on a touch screen.
  it("gives the reset dot a full-size, touch-friendly button around it", () => {
    render(
      <SettingRow controlId="setting-x" label="Wrap long lines" changed onReset={() => {}}>
        <span />
      </SettingRow>,
    );

    const reset = screen.getByRole("button", { name: "Reset Wrap long lines to default" });
    expect(reset).toHaveAttribute("data-slot", "button");
    expect(reset).toHaveAttribute("data-size", "icon-xs");
  });
});
