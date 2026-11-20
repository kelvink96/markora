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

  it("is a Field whose label points at its control", () => {
    render(
      <SettingRow controlId="setting-x" label="Wrap long lines" description="Soft-wrap long lines.">
        <input id="setting-x" type="checkbox" />
      </SettingRow>,
    );

    const control = screen.getByRole("checkbox", { name: "Wrap long lines" });
    expect(control.closest("[data-slot=field]")).not.toBeNull();
    expect(screen.getByText("Wrap long lines")).toHaveAttribute("data-slot", "field-label");
    expect(screen.getByText("Soft-wrap long lines.")).toHaveAttribute("data-slot", "field-description");
  });

  // A composite control (a segmented group, a stepper) has no single element for a label to point at,
  // so the row itself is a group named by its title.
  it("names the row's group after the setting when there is no single control to label", () => {
    render(
      <SettingRow controlId="setting-y" label="Editor line spacing" labelable={false}>
        <div role="radiogroup" aria-label="Line spacing options" />
      </SettingRow>,
    );

    const group = screen.getByRole("group", { name: "Editor line spacing" });
    expect(group).toHaveAttribute("data-slot", "field");
    expect(group).toContainElement(screen.getByRole("radiogroup"));
  });
});
