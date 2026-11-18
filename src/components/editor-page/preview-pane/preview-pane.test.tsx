import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PreviewPane } from "./preview-pane";
import { useDocumentStore } from "../../../store/document";
import { createDefaultSettings } from "../../../features/settings/settings-schema";
import { useSettingsStore } from "../../../features/settings/settings-store";

const { renderMock } = vi.hoisted(() => ({
  renderMock: vi.fn(),
}));

vi.mock("../../../platform/markdown", () => ({
  getMarkdownAdapter: () => ({
    render: renderMock,
  }),
}));

describe("PreviewPane", () => {
  beforeEach(() => {
    const settings = createDefaultSettings();
    useDocumentStore.setState({
      content: "# Preview",
      filePath: null,
      isDirty: false,
      openDocuments: [{ id: "document-1", content: "# Preview", filePath: null, isDirty: false }],
      activeDocumentId: "document-1",
    });
    useSettingsStore.setState({
      isHydrated: true,
      settings,
      templateDraft: settings.authoring.newDocumentTemplate,
    });
    renderMock.mockResolvedValue("<h1>Preview</h1>");
  });

  it("renders the preview as a full-width acrylic surface", async () => {
    render(<PreviewPane />);

    await waitFor(() => expect(screen.getByTestId("preview-content")).toBeInTheDocument());
    expect(screen.getByRole("region", { name: "Preview" }).firstElementChild).toHaveClass(
      "app-surface",
    );
    expect(screen.getByTestId("preview-content")).toHaveClass(
      "w-full",
      "rounded-[calc(var(--radius-sm)-1px)]",
    );
  });

  it("uses the shared app preview surface tokens instead of a preview-only theme class", async () => {
    render(<PreviewPane />);

    const content = await screen.findByTestId("preview-content");
    expect(content).not.toHaveAttribute("data-reader-theme");
    expect(content).not.toHaveClass("preview-reader-theme");
    expect(content).toHaveClass("bg-app-preview");
  });

  it("strips script tags from rendered HTML", async () => {
    renderMock.mockResolvedValue('<p>Hello</p><script>alert("xss")</script>');
    render(<PreviewPane />);
    await waitFor(() => {
      const content = screen.getByTestId("preview-content");
      expect(content.innerHTML).toContain("<p>Hello</p>");
      expect(content.innerHTML).not.toContain("<script>");
      expect(content.innerHTML).not.toContain("alert");
    });
  });

  it("renders markdown through the platform adapter instead of calling Tauri directly", async () => {
    render(<PreviewPane />);

    await waitFor(() =>
      expect(renderMock).toHaveBeenCalledWith("# Preview", { documentPath: null }),
    );
  });

  it("passes the document path so relative images can resolve (#3)", async () => {
    useDocumentStore.setState({ filePath: "/notes/today.md" });
    render(<PreviewPane />);

    await waitFor(() =>
      expect(renderMock).toHaveBeenCalledWith("# Preview", { documentPath: "/notes/today.md" }),
    );
  });

  it("keeps local asset image URLs through sanitization (#3)", async () => {
    renderMock.mockResolvedValue(
      '<img src="asset://localhost/%2Fnotes%2Fa.png" alt="a"><img src="http://asset.localhost/C%3A%5Ca.png" alt="b">',
    );
    render(<PreviewPane />);

    await waitFor(() => {
      const images = screen.getByTestId("preview-content").querySelectorAll("img");
      expect(images[0]).toHaveAttribute("src", "asset://localhost/%2Fnotes%2Fa.png");
      expect(images[1]).toHaveAttribute("src", "http://asset.localhost/C%3A%5Ca.png");
    });
  });

  it("replaces images that fail to load with a labelled placeholder (#3)", async () => {
    renderMock.mockResolvedValue('<p><img src="./missing.png" alt="Diagram"></p>');
    render(<PreviewPane />);

    const image = await waitFor(() => {
      const img = screen.getByTestId("preview-content").querySelector("img");
      expect(img).not.toBeNull();
      return img as HTMLImageElement;
    });
    fireEvent.error(image);

    const placeholder = screen.getByRole("img", { name: "Image unavailable: Diagram" });
    expect(placeholder).toHaveClass("preview-image-missing");
    expect(placeholder).toHaveTextContent("Diagram");
  });
});
