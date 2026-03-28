import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentStatus } from "./document-status";

describe("DocumentStatus", () => {
  it("renders a labeled status group with dirty and saved states", () => {
    const { rerender } = render(<DocumentStatus fileName="notes.md" isDirty />);

    expect(screen.getByRole("group", { name: "Document status" })).toBeInTheDocument();
    expect(screen.getByText("notes.md")).toBeInTheDocument();
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(screen.getByText("Unsaved changes").parentElement).toHaveClass("rounded-full");

    rerender(<DocumentStatus fileName="notes.md" isDirty={false} />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });
});
