import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import type { DndContextProps, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import userEvent from "@testing-library/user-event";
import { extractHeadings } from "../../../features/outline/extract-headings";
import { OutlinePanel } from "./outline-panel";

// jsdom has no layout, so dnd-kit can't really move anything here. The real DndContext still renders, and this
// keeps hold of the props it was given so a test can run the handlers a drag would run. The real pointer and
// keyboard movement is checked in a browser.
const dnd = vi.hoisted(() => ({ props: null as unknown }));
vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...actual,
    DndContext: (props: DndContextProps) => {
      dnd.props = props;
      return <actual.DndContext {...props} />;
    },
    // The real overlay renders nothing until dnd-kit itself starts a drag, which jsdom can't do.
    DragOverlay: ({ children }: { children?: React.ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
  };
});
const dndProps = () => dnd.props as Required<Pick<DndContextProps, "onDragStart" | "onDragEnd" | "onDragCancel">> & {
  accessibility: { announcements: Record<string, (event: never) => string | undefined> };
};

const headings = extractHeadings("# Title\n\n## Setup\n\n### Install\n\n## Usage\n");

function renderPanel(overrides: Partial<Parameters<typeof OutlinePanel>[0]> = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(<OutlinePanel headings={headings} activeIndex={-1} onSelect={onSelect} onClose={onClose} {...overrides} />);
  return { onSelect, onClose };
}

describe("OutlinePanel", () => {
  it("is a labelled region with a navigation list of every heading", () => {
    renderPanel();

    expect(screen.getByRole("complementary", { name: "Outline" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Document headings" });
    expect(within(nav).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Title",
      "Setup",
      "Install",
      "Usage",
    ]);
  });

  it("indents nested headings", () => {
    renderPanel();

    const padding = (name: string) => screen.getByRole("button", { name }).style.paddingLeft;
    expect(padding("Title")).toBe("0.5rem");
    expect(padding("Setup")).toBe("1.35rem");
    expect(padding("Install")).toBe("2.2rem");
  });

  it("doesn't indent a document that starts at a deeper level", () => {
    renderPanel({ headings: extractHeadings("## First\n\n### Second") });

    expect(screen.getByRole("button", { name: "First" }).style.paddingLeft).toBe("0.5rem");
    expect(screen.getByRole("button", { name: "Second" }).style.paddingLeft).toBe("1.35rem");
  });

  it("marks the section the cursor is in as the current location", () => {
    renderPanel({ activeIndex: 2 });

    expect(screen.getByRole("button", { name: "Install" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("button", { name: "Title" })).not.toHaveAttribute("aria-current");
  });

  it("marks nothing before the first heading", () => {
    renderPanel({ activeIndex: -1 });

    expect(document.querySelector('[aria-current="location"]')).toBeNull();
  });

  it("reports the clicked heading, with its line and index", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPanel();

    await user.click(screen.getByRole("button", { name: "Usage" }));

    expect(onSelect).toHaveBeenCalledWith({ index: 3, level: 2, text: "Usage", line: 7 });
  });

  it("can be used from the keyboard", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPanel();

    await user.tab(); // Close outline
    await user.tab(); // Title
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ text: "Title" }));
  });

  it("closes from its close button", async () => {
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    await user.click(screen.getByRole("button", { name: "Close outline" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("explains what to do when there are no headings", () => {
    renderPanel({ headings: [] });

    expect(screen.getByText(/No headings yet/)).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

describe("OutlinePanel section moves", () => {
  // Title 0, Setup 1, Install 2 (inside Setup), Usage 3
  const ids = (active: number, over: number | null) =>
    ({ active: { id: String(active) }, over: over === null ? null : { id: String(over) } }) as unknown as DragEndEvent;

  function renderMovable(overrides: Partial<Parameters<typeof OutlinePanel>[0]> = {}) {
    const onSelect = vi.fn();
    const onMoveSection = vi.fn();
    render(
      <OutlinePanel
        headings={headings}
        activeIndex={-1}
        onSelect={onSelect}
        onClose={vi.fn()}
        onMoveSection={onMoveSection}
        {...overrides}
      />,
    );
    return { onSelect, onMoveSection };
  }

  it("gives every row a handle named after its heading, separate from the row's own button", () => {
    renderMovable();

    for (const text of ["Title", "Setup", "Install", "Usage"]) {
      expect(screen.getByRole("button", { name: `Move section: ${text}` })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: text })).toBeInTheDocument();
    }
  });

  it("still jumps to the heading when a row is clicked, and never when its handle is", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderMovable();

    await user.click(screen.getByRole("button", { name: "Setup" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ text: "Setup" }));

    await user.click(screen.getByRole("button", { name: "Move section: Usage" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows each section's word count, small, beside its row", () => {
    renderMovable({ wordCounts: [4, 2, 1, 1] });

    expect(screen.getByText("4 words")).toBeInTheDocument();
    expect(screen.getByText("2 words")).toBeInTheDocument();
    expect(screen.getAllByText("1 word")).toHaveLength(2);
  });

  it("shows no counts when none are given", () => {
    renderMovable();

    expect(screen.queryByText(/ words?$/)).toBeNull();
  });

  it("moves a section before the row it is dropped on when dragged up", () => {
    const { onMoveSection } = renderMovable();

    act(() => dndProps().onDragEnd(ids(3, 1)));

    expect(onMoveSection).toHaveBeenCalledWith(3, 1);
  });

  it("moves a section after the whole section of the row it is dropped on when dragged down", () => {
    const { onMoveSection } = renderMovable();

    act(() => dndProps().onDragEnd(ids(1, 3)));

    expect(onMoveSection).toHaveBeenCalledWith(1, 4);
  });

  it("does nothing for a drop on itself, inside its own section, or nowhere", () => {
    const { onMoveSection } = renderMovable();

    act(() => dndProps().onDragEnd(ids(1, 1)));
    act(() => dndProps().onDragEnd(ids(1, 2)));
    act(() => dndProps().onDragEnd(ids(1, null)));

    expect(onMoveSection).not.toHaveBeenCalled();
  });

  it("hides the dragged section's sub-section rows while dragging, and brings them back after", () => {
    renderMovable();
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();

    act(() => dndProps().onDragStart({ active: { id: "1" } } as unknown as DragStartEvent));
    expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
    expect(screen.getByRole("button", { name: "Usage" })).toBeInTheDocument();

    act(() => dndProps().onDragCancel(ids(1, null) as never));
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();

    act(() => dndProps().onDragStart({ active: { id: "1" } } as unknown as DragStartEvent));
    act(() => dndProps().onDragEnd(ids(1, 3)));
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();
  });

  it("announces a drag to screen readers", () => {
    renderMovable();
    const { announcements } = dndProps().accessibility;

    expect(announcements.onDragStart({ active: { id: "1" } } as never)).toBe("Picked up section Setup");
    expect(announcements.onDragOver(ids(1, 3) as never)).toBe("Setup is over Usage");
    expect(announcements.onDragEnd(ids(3, 1) as never)).toBe("Moved Usage before Setup");
    expect(announcements.onDragEnd(ids(1, 3) as never)).toBe("Moved Setup after Usage");
    expect(announcements.onDragEnd(ids(1, 2) as never)).toBe("Move cancelled");
    expect(announcements.onDragEnd(ids(1, null) as never)).toBe("Move cancelled");
    expect(announcements.onDragCancel(ids(1, null) as never)).toBe("Move cancelled");
  });

  it("keeps the hidden sub-section rows' space while dragging, so the rows below don't move under dnd-kit", () => {
    renderMovable();

    act(() => dndProps().onDragStart({ active: { id: "1" } } as unknown as DragStartEvent));

    // Taking them out of the list shifted the rows mid-drag and dnd-kit lost track of where the pointer was
    // (seen in a real browser), so they stay in place, just invisible and out of the accessibility tree.
    const concealed = screen.getByText("Install").closest("li");
    expect(concealed).toHaveStyle({ visibility: "hidden" });
    expect(concealed).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Usage").closest("li")).not.toHaveStyle({ visibility: "hidden" });

    act(() => dndProps().onDragCancel(ids(1, null) as never));
    expect(screen.getByText("Install").closest("li")).not.toHaveStyle({ visibility: "hidden" });
  });

  it("draws the dragged row outside the panel, whose backdrop blur would otherwise make it position against the panel", () => {
    renderMovable({ wordCounts: [4, 2, 1, 1] });

    act(() => dndProps().onDragStart({ active: { id: "1" } } as unknown as DragStartEvent));

    // A backdrop-filter makes position: fixed children position against the panel, not the window: the
    // overlay (and so dnd-kit's idea of where the dragged row is) sat a panel-offset away from the pointer.
    const overlay = screen.getByTestId("drag-overlay");
    expect(overlay).toHaveTextContent("Setup");
    expect(overlay).toHaveTextContent("2 words");
    expect(overlay.closest("aside")).toBeNull();
  });

  it("offers no handles when it was not given a way to move sections", () => {
    renderPanel();

    expect(screen.queryByRole("button", { name: /^Move section:/ })).toBeNull();
  });
});
