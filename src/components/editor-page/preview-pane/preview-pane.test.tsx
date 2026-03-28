import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PreviewPane } from "./preview-pane";
import { useDocumentStore } from "../../../store/document";
import { createDefaultSettings } from "../../../features/settings/settings-schema";
import { useSettingsStore } from "../../../features/settings/settings-store";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
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
    invokeMock.mockResolvedValue("<h1>Preview</h1>");
  });

  it("renders the preview as a full-width acrylic surface", async () => {
    render(<PreviewPane />);

    await waitFor(() => expect(screen.getByTestId("preview-content")).toBeInTheDocument());
    expect(screen.getByRole("region", { name: "Preview" }).firstElementChild).toHaveClass(
      "rounded-app-sm",
      "bg-[color:var(--glass-panel)]",
      "backdrop-blur-[var(--glass-blur-soft)]",
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
    invokeMock.mockResolvedValue('<p>Hello</p><script>alert("xss")</script>');
    render(<PreviewPane />);
    await waitFor(() => {
      const content = screen.getByTestId("preview-content");
      expect(content.innerHTML).toContain("<p>Hello</p>");
      expect(content.innerHTML).not.toContain("<script>");
      expect(content.innerHTML).not.toContain("alert");
    });
  });
});
