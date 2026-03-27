import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WordCount } from "./word-count";

describe("WordCount", () => {
  it("renders a singular label", () => {
    render(<WordCount value={1} />);
    expect(screen.getByText("1 word")).toBeInTheDocument();
  });

  it("renders a plural label", () => {
    render(<WordCount value={12} />);
    expect(screen.getByText("12 words")).toBeInTheDocument();
  });
});
