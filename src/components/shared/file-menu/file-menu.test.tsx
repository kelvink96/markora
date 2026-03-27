import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileMenu } from "./file-menu";

describe("FileMenu", () => {
  it("renders the file actions trigger", () => {
    const handlers = {
      onNew: vi.fn(),
      onOpen: vi.fn(),
      onSave: vi.fn(),
      onSaveAs: vi.fn(),
    };

    render(<FileMenu {...handlers} />);

    expect(screen.getByRole("button", { name: "File actions" })).toBeInTheDocument();
  });

  it("does not wrap the trigger in an extra element", () => {
    const handlers = {
      onNew: vi.fn(),
      onOpen: vi.fn(),
      onSave: vi.fn(),
      onSaveAs: vi.fn(),
    };

    const { container } = render(<FileMenu {...handlers} />);

    expect(container.querySelector(".file-menu__trigger")).toBeNull();
  });
});
