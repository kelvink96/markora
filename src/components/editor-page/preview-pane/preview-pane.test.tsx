import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PreviewPane } from "./preview-pane";
import { useDocumentStore } from "../../../store/document";

// Replace Tauri's runtime bridge with a predictable mock for tests.
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn((_command: string, args: { markdown: string }) =>
    Promise.resolve(`<p>${args.markdown}</p>`),
  ),
}));

describe("PreviewPane", () => {
  it("renders a labeled preview region with a stable content hook", async () => {
    useDocumentStore.setState({ content: "hello", filePath: null, isDirty: false });

    render(<PreviewPane />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Preview" })).toBeInTheDocument();
      expect(screen.getByTestId("preview-content").innerHTML).toContain("<p>hello</p>");
      expect(screen.getByRole("region", { name: "Preview" })).toHaveClass(
        "h-full",
        "py-4",
        "pl-0",
        "pr-4",
      );
      expect(screen.getByTestId("preview-content")).toHaveClass(
        "mx-auto",
        "max-w-[48rem]",
      );
    });
  });
});
