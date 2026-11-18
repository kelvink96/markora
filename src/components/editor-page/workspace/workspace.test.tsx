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

function renderPanes(viewMode: "split" | "preview" | "edit", syncScroll = true) {
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

describe("Workspace scroll sync (#12)", () => {
  beforeEach(() => useSettingsStore.setState({ settings: createDefaultSettings() }));

  it("scrolls the preview along with the editor in split view", () => {
    const { editor, preview } = renderPanes("split");

    editor.scrollTop = 750;
    fireEvent.scroll(editor);

    expect(preview!.scrollTop).toBe(1200);
  });

  it("also syncs in preview view, where both panes are showing", () => {
    const { editor, preview } = renderPanes("preview");

    editor.scrollTop = 750;
    fireEvent.scroll(editor);

    expect(preview!.scrollTop).toBe(1200);
  });

  it("leaves the panes independent when the setting is off", () => {
    const { editor, preview } = renderPanes("split", false);

    editor.scrollTop = 750;
    fireEvent.scroll(editor);

    expect(preview!.scrollTop).toBe(0);
  });

  it("has no preview to sync with in edit view", () => {
    const { editor, preview } = renderPanes("edit");

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

  it("renders only the editor in edit mode", () => {
    render(<Workspace sidebar={<div>Sidebar</div>} left={<div>Left</div>} right={<div>Right</div>} viewMode="edit" />);

    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Editor workspace" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Preview workspace" })).not.toBeInTheDocument();
    expect(screen.queryByRole("separator", { name: "Resize editor and preview panes" })).not.toBeInTheDocument();
  });

  it("renders a preview-dominant layout in preview mode", () => {
    render(<Workspace sidebar={<div>Sidebar</div>} left={<div>Left</div>} right={<div>Right</div>} viewMode="preview" />);

    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Preview workspace" })).toHaveStyle({ width: "68%" });
    expect(screen.getByRole("region", { name: "Editor workspace" })).toHaveStyle({ width: "32%" });
  });
});
