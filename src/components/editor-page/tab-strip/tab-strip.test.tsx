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
        onCloseAllTabs={vi.fn()}
        onNewTab={vi.fn()}
      />,
    );

    expect(container.firstChild).toHaveClass(
      "tab-strip",
      "bg-[color:var(--glass-panel-strong)]",
    );
    const activeTab = screen.getByRole("tab", { name: "one.md" });
    const inactiveTab = screen.getByRole("tab", { name: "Untitled *" });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(activeTab.parentElement).toHaveClass(
      "tab-strip__tab",
      "rounded-app-md",
      "bg-[color:color-mix(in_srgb,var(--glass-elevated)_88%,var(--surface-panel-strong))]",
    );
    expect(inactiveTab.parentElement).toHaveClass(
      "tab-strip__tab",
      "rounded-app-md",
      "bg-[color:color-mix(in_srgb,var(--surface-panel)_90%,var(--surface-subtle))]",
    );
    expect(screen.getByRole("button", { name: "New tab" })).toHaveClass(
      "tab-strip__new-tab",
      "rounded-app-md",
    );
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
        onCloseAllTabs={vi.fn()}
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

  it("keeps the close action inside the tab item without selecting the tab", async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();

    render(
      <TabStrip
        tabs={[{ id: "one", content: "", filePath: "D:\\notes\\one.md", isDirty: false }]}
        activeTabId="one"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onCloseAllTabs={vi.fn()}
        onNewTab={vi.fn()}
      />,
    );

    const tab = screen.getByRole("tab", { name: "one.md" });
    const closeButton = screen.getByRole("button", { name: "Close one.md" });

    expect(tab.parentElement).toContainElement(closeButton);

    await user.click(closeButton);

    expect(onCloseTab).toHaveBeenCalledWith("one");
    expect(onSelectTab).not.toHaveBeenCalled();
  });

  it("renders icon glyphs for the close and new tab actions", () => {
    render(
      <TabStrip
        tabs={[{ id: "one", content: "", filePath: "D:\\notes\\one.md", isDirty: false }]}
        activeTabId="one"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onCloseAllTabs={vi.fn()}
        onNewTab={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Close one.md" }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "New tab" }).querySelector("svg")).not.toBeNull();
  });

  it("offers a menu action to close all tabs", async () => {
    const user = userEvent.setup();
    const onCloseAllTabs = vi.fn();

    render(
      <TabStrip
        tabs={[
          { id: "one", content: "", filePath: "D:\\notes\\one.md", isDirty: false },
          { id: "two", content: "", filePath: "D:\\notes\\two.md", isDirty: false },
        ]}
        activeTabId="one"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onCloseAllTabs={onCloseAllTabs}
        onNewTab={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tab actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Close all tabs" }));

    expect(onCloseAllTabs).toHaveBeenCalledOnce();
  });
});
