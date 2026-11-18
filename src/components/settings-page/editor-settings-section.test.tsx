import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { EditorSettingsSection } from "./editor-settings-section";

function renderSection() {
  const user = userEvent.setup();
  const settings = createDefaultSettings();
  const onSave = vi.fn();

  function TestHarness() {
    const [editor, setEditor] = useState(settings.editor);

    return (
      <EditorSettingsSection
        editor={editor}
        savedEditor={settings.editor}
        onEditorChange={setEditor}
        onSave={onSave}
      />
    );
  }

  render(<TestHarness />);
  return { user, onSave, defaults: settings.editor };
}

describe("EditorSettingsSection", () => {
  it("shows every editor setting that has an effect", () => {
    renderSection();

    expect(screen.getByRole("switch", { name: "Show line numbers" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Wrap long lines" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Highlight the current line" })).toBeChecked();
  });

  it("saves the toggled options", async () => {
    const { user, onSave, defaults } = renderSection();

    await user.click(screen.getByRole("switch", { name: "Wrap long lines" }));
    await user.click(screen.getByRole("switch", { name: "Highlight the current line" }));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith({
      ...defaults,
      wordWrap: false,
      highlightActiveLine: false,
    });
  });
});
