import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InlineFormattingMenu } from "./inline-formatting-menu";

describe("InlineFormattingMenu", () => {
  it("is a labelled toolbar of the quick formatting actions", () => {
    render(<InlineFormattingMenu position={{ top: 10, left: 20 }} onSelect={vi.fn()} />);

    expect(screen.getByRole("toolbar", { name: "Inline formatting" })).toBeInTheDocument();
    for (const name of ["Bold", "Italic", "Link", "Heading", "Bullet list", "Quote", "Code block"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("passes the chosen action to onSelect", () => {
    const onSelect = vi.fn();
    render(<InlineFormattingMenu position={{ top: 0, left: 0 }} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Bullet list" }));
    fireEvent.click(screen.getByRole("button", { name: "Code block" }));

    expect(onSelect).toHaveBeenNthCalledWith(1, "bulletList");
    expect(onSelect).toHaveBeenNthCalledWith(2, "codeBlock");
  });

  it("doesn't take focus from the editor, so the text selection survives a click", () => {
    render(<InlineFormattingMenu position={{ top: 0, left: 0 }} onSelect={vi.fn()} />);

    const notPrevented = fireEvent.mouseDown(screen.getByRole("button", { name: "Bold" }));

    expect(notPrevented).toBe(false); // preventDefault was called
  });

  it("is placed at the given position inside the editor", () => {
    render(<InlineFormattingMenu position={{ top: 42, left: 17 }} onSelect={vi.fn()} />);

    expect(screen.getByRole("toolbar").parentElement).toHaveStyle({ top: "42px", left: "17px" });
  });
});
