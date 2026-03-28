import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Text } from "./text";

describe("Text", () => {
  it("renders a paragraph by default", () => {
    render(<Text>Body copy</Text>);

    const paragraph = screen.getByText("Body copy");
    expect(paragraph.tagName).toBe("P");
    expect(paragraph).toHaveClass("text-sm", "text-app-text");
  });

  it("supports semantic override and style variants", () => {
    render(
      <Text as="span" size="xs" tone="subtle" weight="medium" truncate>
        Status metadata
      </Text>,
    );

    const text = screen.getByText("Status metadata");
    expect(text.tagName).toBe("SPAN");
    expect(text).toHaveClass("text-xs", "font-medium", "text-app-text-muted", "truncate");
  });
});
