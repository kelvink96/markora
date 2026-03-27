import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "./top-bar";

describe("TopBar", () => {
  it("renders document metadata and control groups", () => {
    render(
      <TopBar
        fileName="notes.md"
        isDirty
        onThemeToggle={() => {}}
        onNew={() => {}}
        onOpen={() => {}}
        onSave={() => {}}
        onSaveAs={() => {}}
      />,
    );

    expect(screen.getByText("notes.md")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders document, menu, and utility zones", () => {
    render(
      <TopBar
        fileName="notes.md"
        isDirty
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
      />,
    );

    expect(screen.getByTestId("top-bar-document")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-menu")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-utilities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
  });

  it("uses a compact command bar layout", () => {
    render(
      <TopBar
        fileName="notes.md"
        isDirty
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
      />,
    );

    expect(screen.getByRole("banner")).toHaveClass("px-3", "py-2.5");
    expect(screen.getByTestId("top-bar-menu")).toHaveClass("rounded-[var(--radius-md)]");
    expect(screen.getByTestId("top-bar-menu")).toHaveClass("px-1", "py-0.5");
    expect(screen.getByTestId("top-bar-utilities")).toHaveClass("rounded-full", "p-0");
  });

  it("renders a settings icon button", () => {
    render(
      <TopBar
        fileName="notes.md"
        isDirty={false}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("keeps document identity separate from utility controls", () => {
    render(
      <TopBar
        fileName="notes.md"
        isDirty={false}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
      />,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-document")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-utilities")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bold" })).not.toBeInTheDocument();
  });

  it("invokes file actions from the File menu", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <TopBar
        fileName="notes.md"
        isDirty={false}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={onOpen}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "File" }));
    await user.click(screen.getByRole("menuitem", { name: "Open" }));

    expect(onOpen).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "File actions" })).not.toBeInTheDocument();
  });

  it("keeps the utility zone focused on a single settings action", () => {
    render(
      <TopBar
        fileName="notes.md"
        isDirty={false}
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.queryByText("Live Preview")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
