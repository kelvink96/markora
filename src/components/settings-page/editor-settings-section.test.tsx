import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { EditorSettingsSection } from "./editor-settings-section";

function renderSection() {
  const user = userEvent.setup();
  const settings = createDefaultSettings();
  const onChange = vi.fn();

  function TestHarness() {
    const [editor, setEditor] = useState(settings.editor);

    return (
      <EditorSettingsSection
        editor={editor}
        onChange={(next) => {
          setEditor(next);
          onChange(next);
        }}
      />
    );
  }

  render(<TestHarness />);
  return { user, onChange, defaults: settings.editor };
}

describe("EditorSettingsSection", () => {
  it("shows every editor setting that has an effect", () => {
    renderSection();

    expect(screen.getByRole("switch", { name: "Show line numbers" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Wrap long lines" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Highlight the current line" })).toBeChecked();
  });

  it("applies each toggle as soon as it is flipped, with no Save step", async () => {
    const { user, onChange, defaults } = renderSection();

    await user.click(screen.getByRole("switch", { name: "Wrap long lines" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...defaults, wordWrap: false });

    await user.click(screen.getByRole("switch", { name: "Highlight the current line" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...defaults, wordWrap: false, highlightActiveLine: false });
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });
});
