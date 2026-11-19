import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Workspace } from "./workspace";
import { createDefaultSettings } from "../../../features/settings/settings-schema";
import { useSettingsStore } from "../../../features/settings/settings-store";

// jsdom has no layout: give a scroller a fixed content height and a window onto it.
function stubScroller(element: HTMLElement, scrollHeight: number, clientHeight: number) {
  let scrollTop = 0;
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });
}

function renderPanes(viewMode: "split" | "read" | "write", syncScroll = true) {
  const settings = createDefaultSettings();
  settings.preview.syncScroll = syncScroll;
  useSettingsStore.setState({ settings });

  render(
    <Workspace
      viewMode={viewMode}
      left={<div className="cm-scroller" data-testid="editor-scroller" />}
      right={<div className="preview-pane__surface" data-testid="preview-scroller" />}
    />,
  );
  const editor = screen.getByTestId("editor-scroller");
  stubScroller(editor, 2000, 500);
  const preview = screen.queryByTestId("preview-scroller");
  if (preview) stubScroller(preview, 3000, 600);
  return { editor, preview };
}

describe("Workspace with a sidebar (#16)", () => {
  it("measures the panes beside the sidebar, so the sidebar can't push them out of the window", () => {
    render(
      <Workspace
        viewMode="split"
        sidebar={<div>Outline</div>}
        left={<div>Left</div>}
        right={<div>Right</div>}
      />,
    );

    const sidebar = screen.getByText("Outline").parentElement!;
    const paneBox = screen.getByText("Left").parentElement!.parentElement!;
    expect(sidebar).toHaveClass("shrink-0");
    expect(paneBox).toHaveClass("flex-1", "min-w-0");
    expect(sidebar.nextElementSibling).toBe(paneBox);
    // Percent widths belong to the panes, not the whole workspace.
    expect(screen.getByText("Left").parentElement).toHaveStyle({ width: "50%" });
  });

  it("still resizes with the keyboard when a sidebar is open", () => {
    render(<Workspace viewMode="split" sidebar={<div>Outline</div>} left={<div>Left</div>} right={<div>Right</div>} />);

    fireEvent.keyDown(screen.getByRole("separator", { name: "Resize editor and preview panes" }), { key: "ArrowRight" });

    expect(screen.getByText("Left").parentElement).toHaveStyle({ width: "55%" });
  });

  it("is a single editor pane with no preview in write view", () => {
    render(<Workspace viewMode="write" sidebar={<div>Outline</div>} left={<div>Left</div>} right={<div>Right</div>} />);

    expect(screen.getByRole("region", { name: "Editor workspace" })).toHaveTextContent("Left");
    expect(screen.queryByText("Right")).not.toBeInTheDocument();
    expect(screen.getByText("Outline")).toBeInTheDocument();
  });

  it("shows the sidebar in read view too", () => {
    render(<Workspace viewMode="read" sidebar={<div>Outline</div>} left={<div>Left</div>} right={<div>Right</div>} />);

    expect(screen.getByText("Outline")).toBeInTheDocument();
  });

  // On a phone a 16rem column leaves the editor a few characters wide, so below the md breakpoint
  // the sidebar floats over the panes instead of taking space from them.
  it.each(["write", "split", "read"] as const)("floats the sidebar over the panes on narrow screens in %s view", (viewMode) => {
    const { container } = render(
      <Workspace viewMode={viewMode} sidebar={<div>Outline</div>} left={<div>Left</div>} right={<div>Right</div>} />,
    );

    const sidebar = screen.getByText("Outline").parentElement!;
    expect(sidebar).toHaveClass("max-md:absolute", "max-md:z-20");
    // The overlay is positioned against the workspace box.
    expect(container.querySelector(".workspace")).toHaveClass("relative");
  });
});

describe("Workspace scroll sync (#12)", () => {
  beforeEach(() => useSettingsStore.setState({ settings: createDefaultSettings() }));

  it("scrolls the preview along with the editor in split view", () => {
    const { editor, preview } = renderPanes("split");

    editor.scrollTop = 750;
    fireEvent.scroll(editor);

    expect(preview!.scrollTop).toBe(1200);
  });

  it("does not sync in read view, where only the preview is showing", () => {
    const { editor, preview } = renderPanes("read");

    editor.scrollTop = 750;
    fireEvent.scroll(editor);

    expect(preview!.scrollTop).toBe(0);
  });

  it("leaves the panes independent when the setting is off", () => {
    const { editor, preview } = renderPanes("split", false);

    editor.scrollTop = 750;
    fireEvent.scroll(editor);

    expect(preview!.scrollTop).toBe(0);
  });

  it("has no preview to sync with in write view", () => {
    const { editor, preview } = renderPanes("write");

    editor.scrollTop = 750;
    expect(() => fireEvent.scroll(editor)).not.toThrow();
    expect(preview).toBeNull();
  });

  it("follows the setting being switched off while open", () => {
    const { editor, preview } = renderPanes("split");

    act(() => useSettingsStore.getState().updatePreview({ syncScroll: false }));
    editor.scrollTop = 750;
    fireEvent.scroll(editor);

    expect(preview!.scrollTop).toBe(0);
  });
});

describe("Workspace", () => {
  it("renders a split layout with a resizable divider", () => {
    const { getByText } = render(
      <Workspace sidebar={<div>Sidebar</div>} left={<div>Left</div>} right={<div>Right</div>} viewMode="split" />,
    );

    const workspace = getByText("Left").closest(".workspace");
    expect(workspace).toHaveClass("flex", "min-h-0", "overflow-hidden", "gap-2", "px-3", "pb-3", "pt-2.5");
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Editor workspace" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Preview workspace" })).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Resize editor and preview panes" })).toHaveClass(
      "cursor-col-resize",
      "rounded-full",
    );
  });

  it("moves the split with keyboard arrows", () => {
    render(<Workspace left={<div>Left</div>} right={<div>Right</div>} viewMode="split" />);
    const divider = screen.getByRole("separator", { name: "Resize editor and preview panes" });
    fireEvent.keyDown(divider, { key: "ArrowRight" });

    expect(screen.getByText("Left").parentElement).toHaveStyle({ width: "55%" });
  });

  it("renders only the editor in write mode", () => {
    render(<Workspace sidebar={<div>Sidebar</div>} left={<div>Left</div>} right={<div>Right</div>} viewMode="write" />);

    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Editor workspace" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Preview workspace" })).not.toBeInTheDocument();
    expect(screen.queryByRole("separator", { name: "Resize editor and preview panes" })).not.toBeInTheDocument();
  });

  it("renders the preview full width in read mode, with no divider", () => {
    render(<Workspace sidebar={<div>Sidebar</div>} left={<div>Left</div>} right={<div>Right</div>} viewMode="read" />);

    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    const reader = screen.getByRole("region", { name: "Reader workspace" });
    expect(reader).toHaveTextContent("Right");
    expect(reader).not.toHaveAttribute("style");
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("keeps the editor mounted but hidden in read mode, so its state survives a round trip", () => {
    const { rerender } = render(<Workspace left={<input aria-label="Draft" />} right={<div>Right</div>} viewMode="write" />);
    fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "typed" } });

    rerender(<Workspace left={<input aria-label="Draft" />} right={<div>Right</div>} viewMode="read" />);
    const parked = screen.getByDisplayValue("typed", { exact: true }).closest("[hidden]");
    expect(parked).not.toBeNull();
    expect(parked).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("region", { name: "Editor workspace" })).not.toBeInTheDocument();

    rerender(<Workspace left={<input aria-label="Draft" />} right={<div>Right</div>} viewMode="write" />);
    expect(screen.getByLabelText("Draft")).toHaveValue("typed");
  });
});
