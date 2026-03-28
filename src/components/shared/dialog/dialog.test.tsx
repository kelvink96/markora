import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialog } from "./dialog";

describe("Dialog", () => {
  it("renders accessible title and actions when open", () => {
    render(
      <Dialog
        open
        title="Reset settings"
        description="This restores defaults."
        actions={<button type="button">Confirm</button>}
      >
        Body
      </Dialog>,
    );

    expect(screen.getByRole("dialog", { name: "Reset settings" })).toBeInTheDocument();
    expect(screen.getByText("This restores defaults.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });
});
