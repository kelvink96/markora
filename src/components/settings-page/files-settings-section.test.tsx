import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { FilesSettingsSection } from "./files-settings-section";

function renderSection({ canRestoreSession = false }: { canRestoreSession?: boolean } = {}) {
  const user = userEvent.setup();
  const settings = createDefaultSettings();
  const onChange = vi.fn();

  function TestHarness() {
    const [files, setFiles] = useState(settings.files);

    return (
      <FilesSettingsSection
        files={files}
        onChange={(next) => {
          setFiles(next);
          onChange(next);
        }}
        canRestoreSession={canRestoreSession}
      />
    );
  }

  render(<TestHarness />);
  return { user, onChange, defaults: settings.files };
}

describe("FilesSettingsSection", () => {
  it("offers autosave and explains what it skips", () => {
    renderSection();

    const autosave = screen.getByRole("switch", { name: "Save changes automatically" });
    expect(autosave).not.toBeChecked();
    expect(autosave).toHaveAccessibleDescription(/Untitled documents are skipped/);
  });

  it("hides the restore-session option outside the desktop app", () => {
    renderSection({ canRestoreSession: false });

    expect(
      screen.queryByRole("switch", { name: "Reopen last session's files on launch" }),
    ).not.toBeInTheDocument();
  });

  it("shows the restore-session option on desktop", () => {
    renderSection({ canRestoreSession: true });

    const restore = screen.getByRole("switch", { name: "Reopen last session's files on launch" });
    expect(restore).not.toBeChecked();
    expect(restore).toHaveAccessibleDescription(/saved files you had open/);
  });

  it("applies each toggle as soon as it is flipped, with no Save step", async () => {
    const { user, onChange, defaults } = renderSection({ canRestoreSession: true });

    await user.click(screen.getByRole("switch", { name: "Save changes automatically" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...defaults, autosave: true });

    await user.click(screen.getByRole("switch", { name: "Reopen last session's files on launch" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...defaults, autosave: true, restorePreviousSession: true });
    // "Save changes automatically" is a switch, so only a button named Save would be a leftover Save step.
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });
});
