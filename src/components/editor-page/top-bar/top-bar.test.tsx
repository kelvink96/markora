import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "./top-bar";

describe("TopBar", () => {
  it("shows mac-style shortcut labels in the File menu on macOS", async () => {
    const user = userEvent.setup();
    const originalPlatform = window.navigator.platform;

    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "MacIntel",
    });

    render(
      <TopBar
        onOpenSettings={vi.fn()}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        viewMode="edit"
        onViewModeChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "File" }));

    expect(screen.getByText("Cmd+N")).toBeInTheDocument();
    expect(screen.getByText("Cmd+Shift+S")).toBeInTheDocument();

    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: originalPlatform,
    });
  });

  it("renders document metadata and control groups", () => {
    render(
      <TopBar
        onOpenSettings={() => {}}
        onThemeToggle={() => {}}
        onNew={() => {}}
        onOpen={() => {}}
        onSave={() => {}}
        onSaveAs={() => {}}
        viewMode="edit"
        onViewModeChange={() => {}}
      />,
    );

    expect(screen.getByLabelText("Formatting")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders document, menu, and utility zones", () => {
    render(
      <TopBar
        onOpenSettings={vi.fn()}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        viewMode="edit"
        onViewModeChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("top-bar-menu")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-utilities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
  });

  it("uses a compact command bar layout", () => {
    render(
      <TopBar
        onOpenSettings={vi.fn()}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        viewMode="edit"
        onViewModeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("banner")).toHaveClass("px-3", "py-2");
    expect(screen.getByRole("banner")).toHaveClass("grid-cols-[auto_minmax(0,1fr)_auto]");
    expect(screen.getByRole("banner")).toHaveClass(
      "top-bar",
      "border-[color:var(--glass-border)]",
      "bg-[color:var(--glass-panel-strong)]",
      "backdrop-blur-[var(--glass-blur-strong)]",
    );
    expect(screen.getByTestId("top-bar-toolbar")).toHaveClass("justify-center");
    expect(screen.getByTestId("top-bar-utilities")).toHaveClass("gap-2", "rounded-app-sm", "p-0.5");
  });

  it("renders a settings icon button", () => {
    render(
      <TopBar
        onOpenSettings={vi.fn()}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        viewMode="edit"
        onViewModeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("keeps document identity separate from utility controls", () => {
    render(
      <TopBar
        onOpenSettings={vi.fn()}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        viewMode="edit"
        onViewModeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-utilities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });

  it("invokes file actions from the File menu", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <TopBar
        onOpenSettings={vi.fn()}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={onOpen}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        viewMode="edit"
        onViewModeChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "File" }));
    await user.click(screen.getByRole("menuitem", { name: "Open" }));

    expect(onOpen).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "File actions" })).not.toBeInTheDocument();
  });

  it("shows only real actions across the four menus", async () => {
    const user = userEvent.setup();

    render(
      <TopBar
        onOpenSettings={vi.fn()}
        onOpenKeyboardShortcuts={vi.fn()}
        onOpenAbout={vi.fn()}
        onCloseTab={vi.fn()}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        viewMode="edit"
        onViewModeChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "File" }));
    expect(screen.getByRole("menuitem", { name: "Close Tab" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("menuitem", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Paste" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "View" }));
    expect(screen.getByRole("menuitem", { name: "Open Settings" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Preview View" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.getByRole("menuitem", { name: "Keyboard Shortcuts" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "About Markora" })).toBeInTheDocument();
  });

  it("keeps the utility zone focused on a single settings action", () => {
    const onViewModeChange = vi.fn();

    render(
      <TopBar
        onOpenSettings={vi.fn()}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        viewMode="edit"
        onViewModeChange={onViewModeChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Split" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Preview" })).toBeInTheDocument();
    expect(onViewModeChange).not.toHaveBeenCalled();
  });

  it("opens settings from the utility button", async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();

    render(
      <TopBar
        onOpenSettings={onOpenSettings}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        viewMode="edit"
        onViewModeChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Settings" }));

    expect(onOpenSettings).toHaveBeenCalled();
  });
});
