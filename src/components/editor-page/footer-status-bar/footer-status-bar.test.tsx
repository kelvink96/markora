import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FooterStatusBar } from "./footer-status-bar";

describe("FooterStatusBar", () => {
  it("renders a footer status bar with the word count", () => {
    render(<FooterStatusBar wordCount={12} viewMode="write" line={8} column={14} />);

    expect(screen.getByRole("contentinfo", { name: "Footer status bar" })).toBeInTheDocument();
    expect(screen.getByText("Write")).toBeInTheDocument();
    expect(screen.getByText("Markdown")).toBeInTheDocument();
    expect(screen.getByText("Ln 8, Col 14")).toBeInTheDocument();
    expect(screen.getByText("12 words")).toBeInTheDocument();
  });

  it.each([
    ["write", "Write"],
    ["split", "Side-by-side"],
    ["read", "Read"],
  ] as const)("names the %s view %s", (viewMode, label) => {
    render(<FooterStatusBar wordCount={1} viewMode={viewMode} line={1} column={1} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("leaves out the cursor position in Read, where there is no editor to have one", () => {
    render(<FooterStatusBar wordCount={12} viewMode="read" line={8} column={14} />);

    expect(screen.queryByText("Ln 8, Col 14")).not.toBeInTheDocument();
    expect(screen.getByText("12 words")).toBeInTheDocument();
  });
});
