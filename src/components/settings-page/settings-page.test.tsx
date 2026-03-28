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
        onSaveAppearance={() => {}}
        onSaveEditor={() => {}}
        onSavePreview={() => {}}
        onSaveFiles={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    expect(screen.getByRole("heading", { name: "Application" })).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toHaveClass(
      "bg-[color:var(--glass-panel)]",
      "backdrop-blur-[var(--glass-blur-soft)]",
      "rounded-app-sm",
    );
    expect(screen.getByRole("button", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to editor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to editor" }).parentElement).toHaveClass(
      "mb-4",
      "items-start",
    );
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
        onSaveAppearance={() => {}}
        onSaveEditor={() => {}}
        onSavePreview={() => {}}
        onSaveFiles={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "About" }));

    expect(screen.getByRole("heading", { name: "About", level: 3 }).closest("section")).toHaveClass(
      "bg-[color:var(--glass-panel)]",
      "backdrop-blur-[var(--glass-blur-soft)]",
    );
    expect(screen.getByText("Markora is a desktop-first markdown editor.")).toBeInTheDocument();
    expect(screen.getByText("Version 0.1.0")).toBeInTheDocument();
  });

  it("keeps reader color scheme controls inside the appearance section", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onSaveAppearance={() => {}}
        onSaveEditor={() => {}}
        onSavePreview={() => {}}
        onSaveFiles={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Appearance" }));

    expect(screen.getByRole("heading", { name: "Appearance", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reader Color Scheme", level: 3 })).toBeInTheDocument();
    expect(screen.getByLabelText(/Reader color scheme/i)).toBeInTheDocument();
  });

  it("lets the user save the template draft explicitly", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    const onSaveTemplate = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft="# Draft"
        version="0.1.0"
        onClose={() => {}}
        onSaveAppearance={() => {}}
        onSaveEditor={() => {}}
        onSavePreview={() => {}}
        onSaveFiles={() => {}}
        onSaveTemplate={onSaveTemplate}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "New Document Template" }));
    await user.clear(screen.getByLabelText("Template content"));
    await user.type(screen.getByLabelText("Template content"), "# New draft");
    await user.click(screen.getByRole("button", { name: "Save template" }));

    expect(onSaveTemplate).toHaveBeenCalledWith("# New draft");
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
        onSaveAppearance={() => {}}
        onSaveEditor={() => {}}
        onSavePreview={() => {}}
        onSaveFiles={() => {}}
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

  it("saves editor settings explicitly from the section action", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    settings.editor.lineNumbers = true;
    const onSaveEditor = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onSaveAppearance={() => {}}
        onSaveEditor={onSaveEditor}
        onSavePreview={() => {}}
        onSaveFiles={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Editor" }));
    await user.click(screen.getByLabelText("Show line numbers"));
    expect(onSaveEditor).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSaveEditor).toHaveBeenCalledWith(
      expect.objectContaining({ lineNumbers: false }),
    );
  });

  it("saves the reader color scheme explicitly from the appearance section", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    const onSavePreview = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onSaveAppearance={() => {}}
        onSaveEditor={() => {}}
        onSavePreview={onSavePreview}
        onSaveFiles={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Appearance" }));
    await user.selectOptions(screen.getByLabelText(/Reader color scheme/i), "sepia");
    expect(onSavePreview).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save reader scheme" }));

    expect(onSavePreview).toHaveBeenCalledWith(
      expect.objectContaining({ readerTheme: "sepia" }),
    );
  });

  it("renders visual preview cards for each reader color scheme", () => {
    const settings = createDefaultSettings();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onSaveAppearance={() => {}}
        onSaveEditor={() => {}}
        onSavePreview={() => {}}
        onSaveFiles={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    expect(screen.getAllByTestId(/reader-swatch-/i)).toHaveLength(4);
    expect(screen.getByTestId("reader-swatch-paper")).toHaveAttribute("data-reader-theme", "paper");
    expect(screen.getByTestId("reader-swatch-sepia")).toHaveClass("preview-reader-theme-sepia");
  });

  it("returns to the workspace from the back action", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    const onClose = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={onClose}
        onSaveAppearance={() => {}}
        onSaveEditor={() => {}}
        onSavePreview={() => {}}
        onSaveFiles={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Back to editor" }));

    expect(onClose).toHaveBeenCalled();
  });
});
