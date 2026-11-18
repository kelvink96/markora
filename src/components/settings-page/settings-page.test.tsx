import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { SettingsPage } from "./settings-page";
import { AboutSettingsSection } from "./about-settings-section";

it("renders a privacy policy link in the about section", () => {
  render(<AboutSettingsSection version="1.0.0" privacyPolicyUrl="https://example.com/privacy" />);
  const link = screen.getByRole("link", { name: /privacy policy/i });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute("href", "https://example.com/privacy");
});

describe("SettingsPage", () => {
  it("renders application and authoring defaults sections", () => {
    const settings = createDefaultSettings();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    expect(screen.getByRole("heading", { name: "Application" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Settings", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Settings sections" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: "Appearance" })).getByTestId("settings-tab-icon-appearance")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: "Advanced" })).getByTestId("settings-tab-icon-advanced")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: "New Document Template" })).getByTestId("settings-tab-icon-template")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to editor" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Authoring Defaults" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Document Template" })).toBeInTheDocument();
  });

  it("marks the current section for assistive technology, whatever the colour scheme", () => {
    const settings = createDefaultSettings();
    settings.appearance.colorScheme = "high-contrast";

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Appearance" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Editor" })).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("settings-tab-icon-appearance")).toHaveClass("size-4");
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
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "About" }));

    expect(screen.getByRole("heading", { name: "About", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Markora is a desktop-first markdown editor.")).toBeInTheDocument();
    expect(screen.getByText("Version 0.1.0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "About" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps app color scheme controls inside the appearance section", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Appearance" }));

    expect(screen.getByRole("heading", { name: "Appearance", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Status Bar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Color Scheme", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Theme mode" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Color scheme" })).toBeInTheDocument();
    expect(screen.getAllByTestId(/theme-swatch-/i)).toHaveLength(3);
    expect(screen.getAllByTestId(/scheme-swatch-/i)).toHaveLength(3);
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
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
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
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={onResetAll}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Advanced" }));
    await user.click(screen.getByRole("button", { name: "Reset all settings" }));

    // Nothing happens until the question is answered.
    const dialog = await screen.findByRole("alertdialog", { name: "Reset all settings?" });
    expect(onResetAll).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Reset everything" }));
    expect(onResetAll).toHaveBeenCalledTimes(1);
  });

  it("keeps every setting when the reset is cancelled", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    const onResetAll = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={onResetAll}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Advanced" }));
    await user.click(screen.getByRole("button", { name: "Reset all settings" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));

    expect(onResetAll).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("applies an editor setting as soon as it is changed", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    settings.editor.lineNumbers = true;
    const onChangeEditor = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onChangeAppearance={() => {}}
        onChangeEditor={onChangeEditor}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Editor" }));
    await user.click(screen.getByLabelText("Show line numbers"));

    expect(onChangeEditor).toHaveBeenCalledWith(
      expect.objectContaining({ lineNumbers: false }),
    );
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });

  it("applies the app color scheme as soon as it is picked", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    const onChangeAppearance = vi.fn();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onChangeAppearance={onChangeAppearance}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Appearance" }));
    await user.click(screen.getByTestId("scheme-swatch-sepia"));

    expect(onChangeAppearance).toHaveBeenCalledWith(
      expect.objectContaining({ colorScheme: "sepia" }),
    );
  });

  it("renders visual preview cards for each app color scheme", () => {
    const settings = createDefaultSettings();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    expect(screen.getAllByTestId(/scheme-swatch-/i)).toHaveLength(3);
    expect(screen.getAllByTestId(/theme-swatch-/i)).toHaveLength(3);
    expect(screen.getByTestId("theme-swatch-system")).toHaveAttribute("data-theme", "system");
    expect(screen.getByTestId("theme-swatch-system")).toHaveAttribute("data-resolved-theme-mode", "light");
    expect(screen.getByTestId("scheme-swatch-standard")).toHaveAttribute("data-color-scheme", "standard");
    expect(screen.getByTestId("scheme-swatch-sepia")).toHaveAttribute("data-color-scheme", "sepia");
    expect(screen.getByTestId("scheme-swatch-sepia")).toHaveAttribute("data-theme-mode", "light");
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
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Back to editor" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("renders icons for the main settings actions", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();

    render(
      <SettingsPage
        settings={settings}
        templateDraft={settings.authoring.newDocumentTemplate}
        version="0.1.0"
        onClose={() => {}}
        onChangeAppearance={() => {}}
        onChangeEditor={() => {}}
        onChangeFiles={() => {}}
        onChangePreview={() => {}}
        onSaveTemplate={() => {}}
        onResetTemplate={() => {}}
        onResetAll={() => {}}
      />,
    );

    expect(within(screen.getByRole("button", { name: "Back to editor" })).getByTestId("settings-back-icon")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Document Template" }));
    expect(within(screen.getByRole("button", { name: "Save template" })).getByTestId("settings-save-icon")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: "Reset template" })).getByTestId("settings-reset-icon")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Advanced" }));
    expect(within(screen.getByRole("button", { name: "Reset all settings" })).getByTestId("settings-danger-icon")).toBeInTheDocument();
  });
});
