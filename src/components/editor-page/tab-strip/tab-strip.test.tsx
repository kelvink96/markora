import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabStrip } from "./tab-strip";

describe("TabStrip", () => {
  const tabs = [
    { id: "one", content: "", filePath: "D:\\notes\\one.md", isDirty: false },
    { id: "two", content: "", filePath: "D:\\notes\\two.md", isDirty: true },
    { id: "three", content: "", filePath: "D:\\notes\\three.md", isDirty: false },
  ];

  function renderStrip(overrides: Partial<Parameters<typeof TabStrip>[0]> = {}) {
    const handlers = {
      onSelectTab: vi.fn(),
      onCloseTab: vi.fn(),
      onCloseAllTabs: vi.fn(),
      onNewTab: vi.fn(),
      onRenameTab: vi.fn(),
    };
    render(<TabStrip tabs={tabs} activeTabId="one" {...handlers} {...overrides} />);
    return handlers;
  }

  it("renders every document as a tab, marks the active one, and offers a new-tab action", () => {
    renderStrip();

    expect(screen.getByRole("tablist", { name: "Open documents" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "one.md" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /two\.md/ })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("button", { name: "New tab" })).toBeInTheDocument();
  });

  it("tells screen readers which tabs have unsaved changes, not just sighted users", () => {
    renderStrip();

    expect(screen.getByRole("tab", { name: "two.md (unsaved)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "one.md" })).toBeInTheDocument(); // clean: no suffix
  });

  it("has a single tab stop: only the active tab is reachable with Tab", () => {
    renderStrip();

    expect(screen.getByRole("tab", { name: "one.md" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: /two\.md/ })).toHaveAttribute("tabindex", "-1");
  });

  it.each([
    ["ArrowRight", "one", "two"],
    ["ArrowLeft", "one", "three"], // wraps around
    ["End", "one", "three"],
    ["Home", "three", "one"],
  ])("%s moves focus from %s to %s and opens it", async (key, from, to) => {
    const user = userEvent.setup();
    const { onSelectTab } = renderStrip({ activeTabId: from });
    const button = (id: string) => screen.getAllByRole("tab").find((tab) => tab.dataset.tabId === id)!;

    button(from).focus();
    await user.keyboard(`{${key}}`);

    expect(button(to)).toHaveFocus();
    expect(onSelectTab).toHaveBeenCalledWith(to);
  });

  it("reveals the close button when a tab is focused, so keyboard users can find it (#5)", async () => {
    const user = userEvent.setup();
    renderStrip({ activeTabId: "two" });

    await user.tab(); // lands on the active tab
    const close = screen.getByRole("button", { name: "Close two.md" });

    // The button is in the tab order and is revealed by the tab's focus-within state.
    expect(close).not.toHaveAttribute("tabindex", "-1");
    expect(close.className).toContain("group-focus-within:opacity-100");
    expect(close.className).toContain("pointer-coarse:opacity-100");
  });

  it("opens a context menu with Rename and Close tab", async () => {
    const user = userEvent.setup();
    const { onRenameTab, onCloseTab } = renderStrip();

    await user.pointer({ keys: "[MouseRight]", target: screen.getByRole("tab", { name: "one.md" }) });
    await user.click(await screen.findByRole("menuitem", { name: "Rename" }));
    expect(onRenameTab).toHaveBeenCalledWith("one");

    await user.pointer({ keys: "[MouseRight]", target: screen.getByRole("tab", { name: /two\.md/ }) });
    await user.click(await screen.findByRole("menuitem", { name: "Close tab" }));
    expect(onCloseTab).toHaveBeenCalledWith("two");
  });

  it("renames a tab on double click", async () => {
    const user = userEvent.setup();
    const { onRenameTab } = renderStrip();

    await user.dblClick(screen.getByRole("tab", { name: "one.md" }));

    expect(onRenameTab).toHaveBeenCalledWith("one");
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
