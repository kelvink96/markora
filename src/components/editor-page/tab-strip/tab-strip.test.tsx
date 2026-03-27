import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabStrip } from "./tab-strip";

describe("TabStrip", () => {
  it("renders tabs with an active document and a new-tab action", () => {
    const { container } = render(
      <TabStrip
        tabs={[
          { id: "one", content: "", filePath: "D:\\notes\\one.md", isDirty: false },
          { id: "two", content: "", filePath: null, isDirty: true },
        ]}
        activeTabId="one"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onNewTab={vi.fn()}
      />,
    );

    expect(container.firstChild).toHaveClass("border-b", "bg-app-panel/96");
    const activeTab = screen.getByRole("tab", { name: "one.md" });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(activeTab.parentElement).toHaveClass("bg-app-panel-strong", "shadow-[var(--shadow-ambient)]");
    expect(screen.getByRole("tab", { name: "Untitled *" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New tab" })).toBeInTheDocument();
  });

  it("invokes tab actions", async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();
    const onNewTab = vi.fn();

    render(
      <TabStrip
        tabs={[{ id: "one", content: "", filePath: "D:\\notes\\one.md", isDirty: false }]}
        activeTabId="one"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewTab={onNewTab}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "one.md" }));
    await user.click(screen.getByRole("button", { name: "Close one.md" }));
    await user.click(screen.getByRole("button", { name: "New tab" }));

    expect(onSelectTab).toHaveBeenCalledWith("one");
    expect(onCloseTab).toHaveBeenCalledWith("one");
    expect(onNewTab).toHaveBeenCalled();
  });

  it("renders icon glyphs for the close and new tab actions", () => {
    render(
      <TabStrip
        tabs={[{ id: "one", content: "", filePath: "D:\\notes\\one.md", isDirty: false }]}
        activeTabId="one"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onNewTab={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Close one.md" }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "New tab" }).querySelector("svg")).not.toBeNull();
  });
});
