import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormattingToolbar } from "./formatting-toolbar";

describe("FormattingToolbar", () => {
  it("renders the formatting buttons", () => {
    render(
      <FormattingToolbar
        onBold={() => {}}
        onItalic={() => {}}
        onList={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
  });

  it("calls the bold handler", () => {
    const onBold = vi.fn();

    render(
      <FormattingToolbar onBold={onBold} onItalic={() => {}} onList={() => {}} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(onBold).toHaveBeenCalled();
  });
});
