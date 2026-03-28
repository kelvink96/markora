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

    await user.click(screen.getByLabelText("Theme mode"));
    await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));
    expect(screen.getByLabelText("Theme mode")).toHaveTextContent("Dark");

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
