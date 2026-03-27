import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormattingToolbar } from "./formatting-toolbar";

describe("FormattingToolbar", () => {
  it("renders the formatting buttons", () => {
    render(
      <FormattingToolbar
        onHeading={() => {}}
        onBold={() => {}}
        onItalic={() => {}}
        onStrike={() => {}}
        onBulletList={() => {}}
        onOrderedList={() => {}}
        onTaskList={() => {}}
        onQuote={() => {}}
        onCodeBlock={() => {}}
        onLink={() => {}}
        onTable={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Heading" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Strikethrough" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bullet list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Numbered list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Task list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Code block" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Table" })).toBeInTheDocument();
  });

  it("exposes the controls as a formatting toolbar", () => {
    render(
      <FormattingToolbar
        onHeading={() => {}}
        onBold={() => {}}
        onItalic={() => {}}
        onStrike={() => {}}
        onBulletList={() => {}}
        onOrderedList={() => {}}
        onTaskList={() => {}}
        onQuote={() => {}}
        onCodeBlock={() => {}}
        onLink={() => {}}
        onTable={() => {}}
      />,
    );

    expect(screen.getByLabelText("Formatting")).toBeInTheDocument();
  });

  it("calls the bold handler", () => {
    const onBold = vi.fn();

    render(
      <FormattingToolbar
        onHeading={() => {}}
        onBold={onBold}
        onItalic={() => {}}
        onStrike={() => {}}
        onBulletList={() => {}}
        onOrderedList={() => {}}
        onTaskList={() => {}}
        onQuote={() => {}}
        onCodeBlock={() => {}}
        onLink={() => {}}
        onTable={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(onBold).toHaveBeenCalled();
  });
});
