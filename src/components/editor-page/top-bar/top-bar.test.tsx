import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
