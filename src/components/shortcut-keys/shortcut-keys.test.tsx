import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShortcutKeys, readShortcuts } from "./shortcut-keys";

describe("ShortcutKeys", () => {
  it("shows each key of a combination as its own key cap, grouped together", () => {
    const { container } = render(<ShortcutKeys shortcut="Ctrl+Shift+S" />);

    const group = container.querySelector("[data-slot=kbd-group]");
    expect(group).not.toBeNull();
    expect([...group!.querySelectorAll("[data-slot=kbd]")].map((key) => key.textContent)).toEqual(["Ctrl", "Shift", "S"]);
  });

  it("keeps a single key as one cap", () => {
    const { container } = render(<ShortcutKeys shortcut="/" />);

    expect(readShortcuts(container)).toEqual(["/"]);
  });

  it("reads rendered shortcuts back as text, for tests and checks", () => {
    const { container } = render(
      <>
        <ShortcutKeys shortcut="⌘+N" />
        <ShortcutKeys shortcut="Ctrl+Shift+P" />
      </>,
    );

    expect(readShortcuts(container)).toEqual(["⌘+N", "Ctrl+Shift+P"]);
  });
});
