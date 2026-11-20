import { describe, expect, it, vi } from "vitest";
import { fireEvent, renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

function handlers() {
  return { onNew: vi.fn(), onOpen: vi.fn(), onSave: vi.fn(), onSaveAs: vi.fn(), onCommandPalette: vi.fn(), onToggleFocus: vi.fn() };
}

describe("useKeyboardShortcuts", () => {
  it.each([
    ["n", {}, "onNew"],
    ["o", {}, "onOpen"],
    ["s", {}, "onSave"],
    ["s", { shiftKey: true }, "onSaveAs"],
    ["k", {}, "onCommandPalette"],
    ["P", { shiftKey: true }, "onCommandPalette"],
    ["F", { shiftKey: true }, "onToggleFocus"],
    ["f", { shiftKey: true }, "onToggleFocus"],
  ] as const)("Ctrl+%s %j calls %s", (key, extra, handlerName) => {
    const fns = handlers();
    renderHook(() => useKeyboardShortcuts(fns));

    fireEvent.keyDown(window, { key, ctrlKey: true, ...extra });

    expect(fns[handlerName]).toHaveBeenCalledTimes(1);
    const others = Object.entries(fns).filter(([name]) => name !== handlerName);
    others.forEach(([, fn]) => expect(fn).not.toHaveBeenCalled());
  });

  it("Ctrl+Shift+F prevents the browser default", () => {
    const fns = handlers();
    renderHook(() => useKeyboardShortcuts(fns));

    const notPrevented = fireEvent.keyDown(window, { key: "F", ctrlKey: true, shiftKey: true });

    expect(notPrevented).toBe(false);
  });

  it("plain Ctrl+F does not toggle Focus, and Shift+F alone does nothing", () => {
    const fns = handlers();
    renderHook(() => useKeyboardShortcuts(fns));

    fireEvent.keyDown(window, { key: "f", ctrlKey: true });
    fireEvent.keyDown(window, { key: "F", shiftKey: true });

    expect(fns.onToggleFocus).not.toHaveBeenCalled();
  });

  it("Cmd+Shift+F toggles Focus on macOS", () => {
    const fns = handlers();
    renderHook(() => useKeyboardShortcuts(fns));

    fireEvent.keyDown(window, { key: "F", metaKey: true, shiftKey: true });

    expect(fns.onToggleFocus).toHaveBeenCalledTimes(1);
  });

  it("also accepts the Cmd key for macOS", () => {
    const fns = handlers();
    renderHook(() => useKeyboardShortcuts(fns));

    fireEvent.keyDown(window, { key: "s", metaKey: true });

    expect(fns.onSave).toHaveBeenCalledTimes(1);
  });

  it("ignores keys pressed without Ctrl or Cmd", () => {
    const fns = handlers();
    renderHook(() => useKeyboardShortcuts(fns));

    fireEvent.keyDown(window, { key: "s" });
    fireEvent.keyDown(window, { key: "n" });

    Object.values(fns).forEach((fn) => expect(fn).not.toHaveBeenCalled());
  });

  it("stops listening after unmount", () => {
    const fns = handlers();
    const { unmount } = renderHook(() => useKeyboardShortcuts(fns));
    unmount();

    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    expect(fns.onSave).not.toHaveBeenCalled();
  });
});
