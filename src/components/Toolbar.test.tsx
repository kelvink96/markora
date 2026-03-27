import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Toolbar } from "./Toolbar";

const props = {
  onNew: vi.fn(),
  onOpen: vi.fn(),
  onSave: vi.fn(),
  onSaveAs: vi.fn(),
  onToggleTheme: vi.fn(),
  theme: "light" as const,
  isDirty: false,
  filePath: null,
};

describe("Toolbar", () => {
  it("renders all action buttons", () => {
    const { getByText } = render(<Toolbar {...props} />);
    expect(getByText("New")).toBeTruthy();
    expect(getByText("Open")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
  });

  it("shows dirty indicator when isDirty is true", () => {
    const { getByText } = render(<Toolbar {...props} isDirty={true} />);
    expect(getByText(/•/)).toBeTruthy();
  });

  it("calls onSave when Save is clicked", () => {
    const onSave = vi.fn();
    const { getByText } = render(<Toolbar {...props} onSave={onSave} />);
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledOnce();
  });
});
