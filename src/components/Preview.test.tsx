import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { Preview } from "./Preview";
import { useDocumentStore } from "../store/document";

// Replace Tauri's runtime bridge with a predictable mock for tests.
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn((_command: string, args: { markdown: string }) =>
    Promise.resolve(`<p>${args.markdown}</p>`),
  ),
}));

describe("Preview", () => {
  it("renders HTML returned from parse_markdown", async () => {
    useDocumentStore.setState({ content: "hello", filePath: null, isDirty: false });

    const { container } = render(<Preview />);

    await waitFor(() => {
      expect(container.querySelector(".preview-container")?.innerHTML).toContain(
        "<p>hello</p>",
      );
    });
  });
});
