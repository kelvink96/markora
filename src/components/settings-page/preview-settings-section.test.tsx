import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { PreviewSettingsSection } from "./preview-settings-section";

function renderSection() {
  const user = userEvent.setup();
  const settings = createDefaultSettings();
  const onChange = vi.fn();

  function TestHarness() {
    const [preview, setPreview] = useState(settings.preview);

    return (
      <PreviewSettingsSection
        preview={preview}
        onChange={(next) => {
          setPreview(next);
          onChange(next);
        }}
      />
    );
  }

  render(<TestHarness />);
  return { user, onChange, defaults: settings.preview };
}

describe("PreviewSettingsSection", () => {
  it("shows the current values", () => {
    renderSection();

    expect(screen.getByRole("combobox", { name: "Line width" })).toHaveTextContent("Normal (72 characters)");
    expect(screen.getByRole("switch", { name: "Scroll the editor and preview together" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Open links in your browser" })).toBeChecked();
  });

  it("explains what turning link opening off does", () => {
    renderSection();

    expect(screen.getByRole("switch", { name: "Open links in your browser" })).toHaveAccessibleDescription(
      /links in the preview do nothing/,
    );
  });

  it("has no Save button, because changes apply immediately", () => {
    renderSection();

    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("applies every change as soon as it is made", async () => {
    const { user, onChange, defaults } = renderSection();

    await user.click(screen.getByRole("combobox", { name: "Line width" }));
    await user.click(await screen.findByRole("option", { name: "Wide (90 characters)" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...defaults, contentWidth: "wide" });

    await user.click(screen.getByRole("switch", { name: "Scroll the editor and preview together" }));
    await user.click(screen.getByRole("switch", { name: "Open links in your browser" }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...defaults,
      contentWidth: "wide",
      syncScroll: false,
      openLinksExternally: false,
    });
  });
});
