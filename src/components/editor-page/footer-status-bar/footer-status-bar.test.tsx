import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FooterStatusBar } from "./footer-status-bar";

describe("FooterStatusBar", () => {
  it("renders a footer status bar with the word count", () => {
    render(<FooterStatusBar wordCount={12} viewMode="split" line={8} column={14} />);

    expect(screen.getByRole("contentinfo", { name: "Footer status bar" })).toBeInTheDocument();
    expect(screen.getByText("split")).toHaveClass("text-app-text");
    expect(screen.getByText("Markdown")).toBeInTheDocument();
    expect(screen.getByText("Ln 8, Col 14")).toBeInTheDocument();
    expect(screen.getByText("12 words")).toBeInTheDocument();
  });
});
