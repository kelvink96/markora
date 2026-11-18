import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        onImage={() => {}}
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
    expect(screen.getByRole("button", { name: "Image" })).toBeInTheDocument();
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
        onImage={() => {}}
      />,
    );

    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument();
  });

  it("moves between buttons with the arrow keys (one tab stop for the whole toolbar)", async () => {
    const user = userEvent.setup();
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
        onImage={() => {}}
      />,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Heading" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();

    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("button", { name: "Bullet list" })).toHaveFocus();

    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "Image" })).toHaveFocus();
  });

  it("disables every button when disabled", () => {
    render(
      <FormattingToolbar
        disabled
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
        onImage={() => {}}
      />,
    );

    expect(screen.getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(true);
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
        onImage={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(onBold).toHaveBeenCalled();
  });
});
