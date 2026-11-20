import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormattingBar } from "./formatting-bar";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";

describe("FormattingBar", () => {
  it("is the formatting toolbar in its own row", () => {
    render(<FormattingBar />);

    expect(screen.getByTestId("formatting-bar")).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument();
  });

  it("is the Tour anchor for the formatting stop", () => {
    render(<FormattingBar />);

    expect(screen.getByTestId("formatting-bar")).toHaveAttribute("data-tour", "formatting-bar");
  });

  it("scrolls sideways when the screen is too narrow, so no button becomes unreachable", () => {
    render(<FormattingBar />);

    expect(screen.getByTestId("formatting-bar")).toHaveClass("overflow-x-auto");
  });

  it.each([
    ["Heading", "heading"],
    ["Bold", "bold"],
    ["Italic", "italic"],
    ["Strikethrough", "strike"],
    ["Bullet list", "bulletList"],
    ["Numbered list", "orderedList"],
    ["Task list", "taskList"],
    ["Quote", "quote"],
    ["Code block", "codeBlock"],
    ["Link", "link"],
    ["Table", "table"],
    ["Image", "image"],
  ] as const)("%s runs the %s editor action", async (label, action) => {
    const user = userEvent.setup();
    const runToolbarAction = vi.fn();
    useEditorCommandState.setState({ runToolbarAction });
    render(<FormattingBar />);

    await user.click(screen.getByRole("button", { name: label }));

    expect(runToolbarAction).toHaveBeenCalledWith(action);
  });

  it("is inert when disabled (the Read view), so no click can edit a document the user cannot see", async () => {
    const user = userEvent.setup();
    const runToolbarAction = vi.fn();
    useEditorCommandState.setState({ runToolbarAction });
    render(<FormattingBar disabled />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toBeDisabled();
      await user.click(button);
    }

    expect(runToolbarAction).not.toHaveBeenCalled();
    // Still there, so the Tour stop that points at it keeps a target.
    expect(screen.getByTestId("formatting-bar")).toHaveAttribute("data-tour", "formatting-bar");
  });
});
