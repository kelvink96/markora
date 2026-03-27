import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FooterStatusBar } from "./footer-status-bar";

describe("FooterStatusBar", () => {
  it("renders a footer status bar with the word count", () => {
    render(<FooterStatusBar wordCount={12} viewMode="split" />);

    expect(screen.getByRole("contentinfo", { name: "Footer status bar" })).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("split")).toBeInTheDocument();
    expect(screen.getByText("Markdown")).toBeInTheDocument();
    expect(screen.getByText("12 words")).toBeInTheDocument();
  });
});
