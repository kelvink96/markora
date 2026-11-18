import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { AppearanceSettingsSection } from "./appearance-settings-section";

function renderSection(previewThemeMode: "light" | "dark" = "light") {
  const user = userEvent.setup();
  const settings = createDefaultSettings();
  const onChange = vi.fn();

  function TestHarness() {
    const [appearance, setAppearance] = useState(settings.appearance);

    return (
      <AppearanceSettingsSection
        appearance={appearance}
        previewThemeMode={previewThemeMode}
        onChange={(next) => {
          setAppearance(next);
          onChange(next);
        }}
      />
    );
  }

  render(<TestHarness />);
  return { user, onChange };
}

describe("AppearanceSettingsSection", () => {
  it("offers theme mode and colour scheme as labelled choices, with the current ones selected", () => {
    renderSection();

    const mode = screen.getByRole("radiogroup", { name: "Theme mode" });
    const scheme = screen.getByRole("radiogroup", { name: "Color scheme" });
    expect(within(mode).getAllByRole("radio")).toHaveLength(3);
    expect(within(scheme).getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByTestId("theme-swatch-system")).toBeChecked();
    expect(screen.getByTestId("scheme-swatch-standard")).toBeChecked();
  });

  it("names the schemes by their character, not by an internal id", () => {
    renderSection();

    const scheme = screen.getByRole("radiogroup", { name: "Color scheme" });
    expect(within(scheme).getByText("Aurora")).toBeInTheDocument();
    expect(within(scheme).getByText("Ember")).toBeInTheDocument();
    expect(within(scheme).getByText("High Contrast")).toBeInTheDocument();
  });

  it("draws each swatch in its own palette rather than as a flat label", () => {
    renderSection("dark");

    const sepia = screen.getByTestId("scheme-swatch-sepia");
    const preview = sepia.querySelector("[data-swatch-scheme]");
    expect(preview).toHaveAttribute("data-swatch-scheme", "sepia");
    expect(preview).toHaveAttribute("data-swatch-mode", "dark"); // shown in the current mode
  });

  it("tags theme swatches with what they resolve to", () => {
    renderSection("dark");

    expect(screen.getByTestId("theme-swatch-system")).toHaveAttribute("data-resolved-theme-mode", "dark");
    expect(screen.getByTestId("theme-swatch-light")).toHaveAttribute("data-resolved-theme-mode", "light");
  });

  it("has no Save buttons: every control applies as soon as it is changed", () => {
    renderSection();

    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("applies the theme mode immediately", async () => {
    const { user, onChange } = renderSection();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("theme-swatch-dark"));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ theme: "dark" }));
  });

  it("applies the colour scheme immediately", async () => {
    const { user, onChange } = renderSection();

    await user.click(screen.getByTestId("scheme-swatch-sepia"));

    expect(screen.getByTestId("scheme-swatch-sepia")).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ colorScheme: "sepia" }));
  });

  it("changing one setting does not re-send a stale copy of another", async () => {
    const { user, onChange } = renderSection();

    await user.click(screen.getByTestId("theme-swatch-dark"));
    await user.click(screen.getByTestId("scheme-swatch-sepia"));

    // The second change carries the first one forward, so nothing is lost.
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ theme: "dark", colorScheme: "sepia" }));
  });

  it("moves between the options with the arrow keys", async () => {
    const { user } = renderSection();

    screen.getByTestId("theme-swatch-system").focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByTestId("theme-swatch-light")).toHaveFocus();
  });

  it("toggles the footer metrics with a switch", async () => {
    const { user, onChange } = renderSection();
    const toggle = screen.getByRole("switch", { name: "Show footer metrics" });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showStatusBar: false }));
  });
});

describe("AppearanceSettingsSection text settings (#13)", () => {
  it("shows the current editor font size, line spacing and preview text size", () => {
    renderSection();

    expect(screen.getByRole("combobox", { name: "Editor font size" })).toHaveTextContent("16 px");
    expect(screen.getByRole("combobox", { name: "Editor line spacing" })).toHaveTextContent("Comfortable");
    expect(screen.getByRole("combobox", { name: "Preview text size" })).toHaveTextContent("100%");
  });

  it("applies the chosen sizes as numbers", async () => {
    const { user, onChange } = renderSection();

    await user.click(screen.getByRole("combobox", { name: "Editor font size" }));
    await user.click(await screen.findByRole("option", { name: "20 px" }));
    await user.click(screen.getByRole("combobox", { name: "Editor line spacing" }));
    await user.click(await screen.findByRole("option", { name: "Spacious" }));
    await user.click(screen.getByRole("combobox", { name: "Preview text size" }));
    await user.click(await screen.findByRole("option", { name: "125%" }));

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ editorFontSize: 20, editorLineHeight: 2.1, previewFontScale: 1.25 }),
    );
  });
});
