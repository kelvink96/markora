import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { FilesSettingsSection } from "./files-settings-section";

function renderSection({ canRestoreSession = false }: { canRestoreSession?: boolean } = {}) {
  const user = userEvent.setup();
  const settings = createDefaultSettings();
  const onSave = vi.fn();

  function TestHarness() {
    const [files, setFiles] = useState(settings.files);

    return (
      <FilesSettingsSection
        files={files}
        savedFiles={settings.files}
        onFilesChange={setFiles}
        onSave={onSave}
        canRestoreSession={canRestoreSession}
      />
    );
  }

  render(<TestHarness />);
  return { user, onSave, defaults: settings.files };
}

describe("FilesSettingsSection", () => {
  it("offers autosave and explains what it skips", () => {
    renderSection();

    const autosave = screen.getByRole("checkbox", { name: "Save changes automatically" });
    expect(autosave).not.toBeChecked();
    expect(autosave).toHaveAccessibleDescription(/Untitled documents are skipped/);
  });

  it("hides the restore-session option outside the desktop app", () => {
    renderSection({ canRestoreSession: false });

    expect(
      screen.queryByRole("checkbox", { name: "Reopen last session's files on launch" }),
    ).not.toBeInTheDocument();
  });

  it("shows the restore-session option on desktop", () => {
    renderSection({ canRestoreSession: true });

    const restore = screen.getByRole("checkbox", { name: "Reopen last session's files on launch" });
    expect(restore).not.toBeChecked();
    expect(restore).toHaveAccessibleDescription(/saved files you had open/);
  });

  it("saves the toggled options", async () => {
    const { user, onSave, defaults } = renderSection({ canRestoreSession: true });

    await user.click(screen.getByRole("checkbox", { name: "Save changes automatically" }));
    await user.click(screen.getByRole("checkbox", { name: "Reopen last session's files on launch" }));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith({
      ...defaults,
      autosave: true,
      restorePreviousSession: true,
    });
  });
});
