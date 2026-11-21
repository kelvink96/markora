import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WindowControls, WindowDragStrip } from "./window-controls";
import type { WindowAdapter } from "../../../platform/window";

function fakeAdapter(overrides: Partial<WindowAdapter> = {}) {
  let resized: (() => void) | undefined;
  const adapter = {
    hasCustomTitleBar: true,
    minimize: vi.fn(async () => {}),
    toggleMaximize: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    isMaximized: vi.fn(async () => false),
    onResized: vi.fn(async (listener: () => void) => {
      resized = listener;
      return () => {};
    }),
    ...overrides,
  } satisfies WindowAdapter;
  return { adapter, resize: () => resized?.() };
}

describe("WindowControls", () => {
  it("renders nothing when the browser owns the window", () => {
    const { adapter } = fakeAdapter({ hasCustomTitleBar: false });
    const { container } = render(<WindowControls adapter={adapter} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("minimises, maximises and closes the window", async () => {
    const user = userEvent.setup();
    const { adapter } = fakeAdapter();
    render(<WindowControls adapter={adapter} />);

    await user.click(screen.getByRole("button", { name: "Minimize" }));
    await user.click(await screen.findByRole("button", { name: "Maximize" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(adapter.minimize).toHaveBeenCalledOnce();
    expect(adapter.toggleMaximize).toHaveBeenCalledOnce();
    expect(adapter.close).toHaveBeenCalledOnce();
  });

  it("offers Restore once the window is maximised, however that happened", async () => {
    let maximized = false;
    const { adapter, resize } = fakeAdapter({ isMaximized: vi.fn(async () => maximized) });
    render(<WindowControls adapter={adapter} />);
    expect(await screen.findByRole("button", { name: "Maximize" })).toBeInTheDocument();

    maximized = true;
    await act(async () => resize());

    expect(await screen.findByRole("button", { name: "Restore" })).toBeInTheDocument();
  });
});

describe("WindowDragStrip", () => {
  it("gives the window a drag area and controls when the header is hidden", () => {
    const { adapter } = fakeAdapter();
    const { container } = render(<WindowDragStrip adapter={adapter} />);

    expect(container.querySelector("[data-tauri-drag-region]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("renders nothing on the web", () => {
    const { adapter } = fakeAdapter({ hasCustomTitleBar: false });
    const { container } = render(<WindowDragStrip adapter={adapter} />);
    expect(container).toBeEmptyDOMElement();
  });
});
