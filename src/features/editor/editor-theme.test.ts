import { describe, expect, it } from "vitest";
import { markdownHighlight } from "./editor-theme";

describe("markdown highlighting", () => {
  // A scheme with no hue (Ink) can't tell links and code from plain text by colour, so it sets these
  // optional tokens to add an underline and a tint. Every other scheme leaves them unset and gets the fallbacks.
  it("lets a scheme add an underline to links and a tint to inline code, defaulting to neither", () => {
    const rules = markdownHighlight.module!.getRules();

    expect(rules).toContain("text-decoration: var(--syntax-link-decoration, none)");
    expect(rules).toContain("background-color: var(--syntax-code-background, transparent)");
  });
});
