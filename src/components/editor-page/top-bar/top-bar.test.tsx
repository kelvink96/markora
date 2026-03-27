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
        wordCount={12}
        theme="light"
        onThemeToggle={() => {}}
        onNew={() => {}}
        onOpen={() => {}}
        onSave={() => {}}
        onSaveAs={() => {}}
      />,
    );

    expect(screen.getByText("notes.md")).toBeInTheDocument();
    expect(screen.getByText("12 words")).toBeInTheDocument();
    expect(screen.getByText("Live Preview")).toBeInTheDocument();
  });

  it("renders document, menu, and utility zones", () => {
    render(
      <TopBar
        fileName="notes.md"
        isDirty
        wordCount={12}
        theme="light"
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
        wordCount={12}
        theme="light"
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
    expect(screen.getByTestId("top-bar-utilities")).toHaveClass("gap-1.5", "px-1.5", "py-0.5");
  });

  it("renders the theme toggle control", () => {
    render(
      <TopBar
        fileName="notes.md"
        isDirty={false}
        wordCount={1}
        theme="light"
        onThemeToggle={vi.fn()}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
      />,
    );

    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("keeps document identity separate from utility controls", () => {
    render(
      <TopBar
        fileName="notes.md"
        isDirty={false}
        wordCount={1}
        theme="light"
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
        wordCount={12}
        theme="light"
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
});
