import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ErrorBanner } from "./error-banner";

describe("ErrorBanner", () => {
  it("renders the error message", () => {
    render(<ErrorBanner message="Failed to save file." onDismiss={() => {}} />);
    expect(screen.getByText("Failed to save file.")).toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Some error" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders nothing when message is null", () => {
    const { container } = render(<ErrorBanner message={null} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
