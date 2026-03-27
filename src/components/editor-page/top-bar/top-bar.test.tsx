import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "./top-bar";

describe("TopBar", () => {
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
    expect(screen.getByTestId("top-bar-toolbar")).toHaveClass("justify-center");
    expect(screen.getByTestId("top-bar-utilities")).toHaveClass("gap-2", "rounded-full", "p-0");
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
