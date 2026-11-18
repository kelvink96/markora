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
});
