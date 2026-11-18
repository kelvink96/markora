import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { AppearanceSettingsSection } from "./appearance-settings-section";

describe("AppearanceSettingsSection", () => {
  it("renders appearance controls and saves the appearance draft explicitly", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    const onSave = vi.fn();

    function TestHarness() {
      const [appearance, setAppearance] = useState(settings.appearance);

      return (
        <AppearanceSettingsSection
          appearance={appearance}
          savedAppearance={settings.appearance}
          previewThemeMode="light"
          onAppearanceChange={setAppearance}
          onSave={onSave}
        />
      );
    }

    render(<TestHarness />);

    expect(screen.queryByLabelText("Theme mode")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Color scheme")).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/theme-swatch-/i)).toHaveLength(3);
    expect(screen.getByRole("checkbox", { name: "Show footer metrics" })).toBeInTheDocument();
    expect(screen.getByTestId("theme-swatch-system")).toHaveAttribute(
      "data-resolved-theme-mode",
      "light",
    );

    await user.click(screen.getByTestId("theme-swatch-dark"));

    await user.click(screen.getByTestId("scheme-swatch-sepia"));
    expect(screen.getByRole("button", { name: "Save color scheme" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Save color scheme" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: "dark",
        colorScheme: "sepia",
      }),
    );
  });
});

describe("AppearanceSettingsSection text settings (#13)", () => {
  function renderSection() {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    const onSave = vi.fn();

    function TestHarness() {
      const [appearance, setAppearance] = useState(settings.appearance);

      return (
        <AppearanceSettingsSection
          appearance={appearance}
          savedAppearance={settings.appearance}
          previewThemeMode="light"
          onAppearanceChange={setAppearance}
          onSave={onSave}
        />
      );
    }

    render(<TestHarness />);
    return { user, onSave };
  }

  it("shows the current editor font size, line spacing and preview text size", () => {
    renderSection();

    expect(screen.getByRole("button", { name: "Editor font size" })).toHaveTextContent("16 px");
    expect(screen.getByRole("button", { name: "Editor line spacing" })).toHaveTextContent("Comfortable");
    expect(screen.getByRole("button", { name: "Preview text size" })).toHaveTextContent("100%");
  });

  it("saves the chosen sizes as numbers", async () => {
    const { user, onSave } = renderSection();

    await user.click(screen.getByRole("button", { name: "Editor font size" }));
    await user.click(screen.getByRole("menuitemradio", { name: "20 px" }));
    await user.click(screen.getByRole("button", { name: "Editor line spacing" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Spacious" }));
    await user.click(screen.getByRole("button", { name: "Preview text size" }));
    await user.click(screen.getByRole("menuitemradio", { name: "125%" }));
    await user.click(screen.getByRole("button", { name: "Save text settings" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ editorFontSize: 20, editorLineHeight: 2.1, previewFontScale: 1.25 }),
    );
  });

  it("keeps Save disabled until something changes", () => {
    renderSection();

    expect(screen.getByRole("button", { name: "Save text settings" })).toBeDisabled();
  });
});
