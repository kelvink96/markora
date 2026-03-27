import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentStatus } from "./document-status";

describe("DocumentStatus", () => {
  it("renders the file name and dirty label", () => {
    render(<DocumentStatus fileName="notes.md" isDirty />);

    expect(screen.getByText("notes.md")).toBeInTheDocument();
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });
});
