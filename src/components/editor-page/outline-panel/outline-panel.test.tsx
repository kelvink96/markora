import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { extractHeadings } from "../../../features/outline/extract-headings";
import { OutlinePanel } from "./outline-panel";

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
