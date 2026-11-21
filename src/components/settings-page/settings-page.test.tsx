import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createDefaultSettings, type MarkoraSettings } from "../../features/settings/settings-schema";
import { COLOR_SCHEMES } from "../../features/settings/color-schemes";
import { detectPlatform } from "../../platform/runtime";
import { SettingsPage } from "./settings-page";

vi.mock("../../platform/runtime", () => ({ detectPlatform: vi.fn(() => "web") }));

function renderPage(overrides: Partial<Parameters<typeof SettingsPage>[0]> = {}, settings?: MarkoraSettings) {
  const current = settings ?? createDefaultSettings();
  const handlers = {
    onClose: vi.fn(),
    onChangeAppearance: vi.fn(),
    onChangeEditor: vi.fn(),
    onChangeFiles: vi.fn(),
    onChangePreview: vi.fn(),
    onSaveTemplate: vi.fn(),
    onResetAll: vi.fn(),
  };
  render(
    <SettingsPage
      settings={current}
      templateDraft={current.authoring.newDocumentTemplate}
      version="0.1.0"
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

const search = () => screen.getByRole("searchbox", { name: "Search settings" });

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("SettingsPage", () => {
  it("shows every group on one page with a jump list", () => {
    renderPage();

    for (const title of ["Appearance", "Writing", "Preview", "Files"]) {
      expect(screen.getByRole("heading", { name: title, level: 3 })).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "Settings", level: 2 })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    expect(within(nav).getAllByRole("button")).toHaveLength(4);
    expect(screen.getAllByTestId(/theme-swatch-/i)).toHaveLength(3);
    expect(screen.getAllByTestId(/scheme-swatch-/i)).toHaveLength(COLOR_SCHEMES.length);
    expect(screen.getByTestId("theme-swatch-system")).toHaveAttribute("data-resolved-theme-mode", "light");
  });

  it("shows the GitHub card below the settings, and hides it while searching", async () => {
    renderPage();

    expect(screen.getByRole("region", { name: "Markora on GitHub" })).toBeInTheDocument();
    await userEvent.type(search(), "night");

    expect(screen.queryByRole("region", { name: "Markora on GitHub" })).not.toBeInTheDocument();
  });

  // Seven or more cards in three columns would leave a long, ragged last row.
  it("lays the colour schemes out four to a row", () => {
    renderPage();

    expect(screen.getByRole("radiogroup", { name: "Color scheme" })).toHaveClass("md:grid-cols-4");
    expect(screen.getByRole("radiogroup", { name: "Theme mode" })).toHaveClass("md:grid-cols-3");
  });

  it("scrolls to a group from the jump list", async () => {
    renderPage();

    await userEvent.click(within(screen.getByRole("navigation", { name: "Settings sections" })).getByRole("button", { name: "Preview" }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("builds the search box from InputGroup, with the icon and shortcut as addons", () => {
    renderPage();

    const group = search().closest("[data-slot=input-group]");
    expect(group).not.toBeNull();
    expect(search()).toHaveAttribute("data-slot", "input-group-control");
    const addons = group!.querySelectorAll("[data-slot=input-group-addon]");
    expect(addons).toHaveLength(2);
    expect(addons[1]).toHaveTextContent("/");
  });

  it("filters settings as you type and hides the jump list", async () => {
    renderPage();

    await userEvent.type(search(), "night");

    expect(screen.getByRole("radiogroup", { name: "Theme mode" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Show line numbers")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Settings sections" })).toBeNull();
  });

  it("announces the number of matching settings through one always-present status region", async () => {
    renderPage();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/^\d+ settings$/);

    await userEvent.type(search(), "night");
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("1 setting found");

    await userEvent.clear(search());
    await userEvent.type(search(), "zzz");
    expect(status).toHaveTextContent("No settings match");
  });

  it("only labels controls that exist", () => {
    renderPage({ canRestoreSession: true });

    for (const label of document.querySelectorAll("label[for]")) {
      expect(document.getElementById(label.getAttribute("for") ?? "")).not.toBeNull();
    }
    expect(screen.getByRole("group", { name: "Editor font size" })).toBeInTheDocument();
  });

  it("shows a message when nothing matches", async () => {
    renderPage();

    await userEvent.type(search(), "zzz");

    expect(screen.getByRole("status")).toHaveTextContent("No settings match");
  });

  it("treats a whitespace-only query as no query", async () => {
    renderPage();

    await userEvent.type(search(), "   ");

    expect(screen.queryByText(/No settings match/)).toBeNull();
    expect(screen.getByLabelText("Show line numbers")).toBeInTheDocument();
  });

  it("does not offer the desktop-only restore option on web, even in search", async () => {
    renderPage();

    await userEvent.type(search(), "restore");

    expect(screen.getByRole("status")).toHaveTextContent("No settings match");
  });

  it("offers the restore option on desktop", async () => {
    renderPage({ canRestoreSession: true });

    await userEvent.type(search(), "restore");

    expect(screen.getByLabelText("Reopen last session's files on launch")).toBeInTheDocument();
  });

  it("clears the query with Escape", async () => {
    renderPage();

    await userEvent.type(search(), "zzz");
    await userEvent.keyboard("{Escape}");

    expect(search()).toHaveValue("");
    expect(screen.getByLabelText("Show line numbers")).toBeInTheDocument();
  });

  it("focuses search when / is pressed outside a text field", async () => {
    renderPage();

    await userEvent.keyboard("/");

    expect(search()).toHaveFocus();
    expect(search()).toHaveValue("");
  });

  it("does not steal / from a text field", async () => {
    renderPage({ canRestoreSession: false });
    await userEvent.type(search(), "a/b");

    expect(search()).toHaveValue("a/b");
  });

  it("applies a toggle as soon as it changes", async () => {
    const { onChangeEditor } = renderPage();

    await userEvent.click(screen.getByLabelText("Show line numbers"));

    expect(onChangeEditor).toHaveBeenCalledWith(expect.objectContaining({ lineNumbers: true }));
    expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
  });

  it("offers Focus dimming as a switch that reflects and changes the setting", async () => {
    const { onChangeEditor } = renderPage();

    const dimming = screen.getByLabelText("Dim other paragraphs in Focus");
    expect(dimming).toBeChecked();

    await userEvent.click(dimming);

    expect(onChangeEditor).toHaveBeenCalledWith(expect.objectContaining({ focusDimming: false }));
  });

  it("finds Focus dimming by searching for focus", async () => {
    renderPage();

    await userEvent.type(search(), "focus");

    expect(screen.getByLabelText("Dim other paragraphs in Focus")).toBeInTheDocument();
    expect(screen.queryByLabelText("Show line numbers")).toBeNull();
  });

  it("applies the color scheme as soon as it is picked", async () => {
    const { onChangeAppearance } = renderPage();

    await userEvent.click(screen.getByTestId("scheme-swatch-sepia"));

    expect(onChangeAppearance).toHaveBeenCalledWith(expect.objectContaining({ colorScheme: "sepia" }));
  });

  it("resets a single changed setting from its dot", async () => {
    const settings = createDefaultSettings();
    settings.appearance.editorLineHeight = 1.9;
    const { onChangeAppearance } = renderPage({}, settings);

    await userEvent.click(screen.getByRole("button", { name: "Reset Editor line spacing to default" }));

    expect(onChangeAppearance).toHaveBeenCalledWith(expect.objectContaining({ editorLineHeight: 1.7 }));
    expect(screen.queryByRole("button", { name: "Reset Editor font size to default" })).toBeNull();
  });

  it("saves the template from its dialog", async () => {
    const { onSaveTemplate } = renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Edit template…" }));
    const textarea = screen.getByRole("textbox", { name: "Template content" });
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "# mine");
    await userEvent.click(screen.getByRole("button", { name: "Save template" }));

    expect(onSaveTemplate).toHaveBeenCalledWith("# mine");
  });

  it("keeps the dialog's Escape from touching the search query", async () => {
    renderPage();
    await userEvent.type(search(), "template");

    await userEvent.click(screen.getByRole("button", { name: "Edit template…" }));
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(search()).toHaveValue("template");
  });

  it("confirms before resetting all settings", async () => {
    const { onResetAll } = renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Reset all settings" }));
    expect(onResetAll).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Reset everything" }));

    expect(onResetAll).toHaveBeenCalledTimes(1);
  });

  it("returns to the workspace from the back action", async () => {
    const { onClose } = renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Back to editor" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("SettingsPage updates card", () => {
  afterEach(() => {
    vi.mocked(detectPlatform).mockReturnValue("web");
  });

  it("is not shown on the web", () => {
    renderPage();

    expect(screen.queryByRole("region", { name: "Updates" })).not.toBeInTheDocument();
  });

  it("is shown on desktop with the app version", () => {
    vi.mocked(detectPlatform).mockReturnValue("desktop");
    renderPage();

    const card = screen.getByRole("region", { name: "Updates" });
    expect(within(card).getByText("Version 0.1.0")).toBeInTheDocument();
  });
});
