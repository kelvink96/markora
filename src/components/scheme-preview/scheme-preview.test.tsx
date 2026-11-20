import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SchemePreview } from "./scheme-preview";

describe("SchemePreview", () => {
  // themes.css paints anything carrying these two attributes in that scheme's palette.
  it("draws itself in the given scheme and mode, and is hidden from assistive technology", () => {
    const { container } = render(<SchemePreview scheme="sepia" mode="dark" />);

    const preview = container.firstElementChild!;
    expect(preview).toHaveAttribute("data-swatch-scheme", "sepia");
    expect(preview).toHaveAttribute("data-swatch-mode", "dark");
    expect(preview).toHaveAttribute("aria-hidden", "true");
  });

  it("is the full-size picture by default and a miniature for menus", () => {
    const { container: full } = render(<SchemePreview scheme="standard" mode="light" />);
    const { container: small } = render(<SchemePreview scheme="standard" mode="light" size="mini" />);

    expect(full.firstElementChild).toHaveAttribute("data-size", "default");
    expect(small.firstElementChild).toHaveAttribute("data-size", "mini");
    // Same drawing at both sizes: a title bar, an editor half and a preview half.
    for (const root of [full, small]) {
      expect(root.querySelector("[data-part=titlebar]")).not.toBeNull();
      expect(root.querySelector("[data-part=editor]")).not.toBeNull();
      expect(root.querySelector("[data-part=preview]")).not.toBeNull();
    }
  });
});
