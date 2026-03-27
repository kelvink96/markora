import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LivePreviewIndicator } from "./live-preview-indicator";

describe("LivePreviewIndicator", () => {
  it("renders the live preview label", () => {
    render(<LivePreviewIndicator />);
    expect(screen.getByText("Live Preview")).toBeInTheDocument();
  });
});
