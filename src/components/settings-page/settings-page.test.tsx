import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { SettingsPage } from "./settings-page";

describe("SettingsPage", () => {
  it("renders application and authoring defaults sections", () => {
    const settings = createDefaultSettings();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onUpdateAppearance={() => {}}
        onUpdateEditor={() => {}}
        onUpdatePreview={() => {}}
        onUpdateFiles={() => {}}
        onTemplateDraftChange={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    expect(screen.getByRole("heading", { name: "Application" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Authoring Defaults" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Document Template" })).toBeInTheDocument();
  });

  it("switches sections from the sidebar", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onUpdateAppearance={() => {}}
        onUpdateEditor={() => {}}
        onUpdatePreview={() => {}}
        onUpdateFiles={() => {}}
        onTemplateDraftChange={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "About" }));

    expect(screen.getByText("Markora is a desktop-first markdown editor.")).toBeInTheDocument();
    expect(screen.getByText("Version 0.1.0")).toBeInTheDocument();
  });

  it("lets the user save the template draft explicitly", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    const onTemplateDraftChange = vi.fn();
    const onSaveTemplate = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft="# Draft"
        version="0.1.0"
        onClose={() => {}}
        onUpdateAppearance={() => {}}
        onUpdateEditor={() => {}}
        onUpdatePreview={() => {}}
        onUpdateFiles={() => {}}
        onTemplateDraftChange={onTemplateDraftChange}
        onSaveTemplate={onSaveTemplate}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "New Document Template" }));
    await user.clear(screen.getByLabelText("Template content"));
    await user.type(screen.getByLabelText("Template content"), "# New draft");
    await user.click(screen.getByRole("button", { name: "Save template" }));

    expect(onTemplateDraftChange).toHaveBeenCalled();
    expect(onSaveTemplate).toHaveBeenCalled();
  });

  it("confirms before resetting all settings", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    const onResetAll = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onUpdateAppearance={() => {}}
        onUpdateEditor={() => {}}
        onUpdatePreview={() => {}}
        onUpdateFiles={() => {}}
        onTemplateDraftChange={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={onResetAll}
      />,
    );

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Advanced" }));
    await user.click(screen.getByRole("button", { name: "Reset all settings" }));

    expect(onResetAll).toHaveBeenCalled();
  });

  it("lets the user toggle line numbers from the editor section", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    settings.editor.lineNumbers = true;
    const onUpdateEditor = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onUpdateAppearance={() => {}}
        onUpdateEditor={onUpdateEditor}
        onUpdatePreview={() => {}}
        onUpdateFiles={() => {}}
        onTemplateDraftChange={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Editor" }));
    await user.click(screen.getByLabelText("Show line numbers"));

    expect(onUpdateEditor).toHaveBeenCalledWith({ lineNumbers: false });
  });
});
