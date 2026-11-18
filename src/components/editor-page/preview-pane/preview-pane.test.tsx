import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PreviewPane } from "./preview-pane";
import { useDocumentStore } from "../../../store/document";
import { createDefaultSettings } from "../../../features/settings/settings-schema";
import { useSettingsStore } from "../../../features/settings/settings-store";

const { renderMock, openExternalMock } = vi.hoisted(() => ({
  renderMock: vi.fn(),
  openExternalMock: vi.fn(),
}));

vi.mock("../../../platform/links", () => ({
  getLinkAdapter: () => ({ openExternal: openExternalMock }),
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
    openExternalMock.mockReset();
    openExternalMock.mockResolvedValue(undefined);
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

  it("exposes the preview font scale setting to the stylesheet (#13)", async () => {
    const settings = createDefaultSettings();
    settings.appearance.previewFontScale = 1.25;
    useSettingsStore.setState({ settings });
    render(<PreviewPane />);

    await waitFor(() =>
      expect(screen.getByTestId("preview-content").style.getPropertyValue("--preview-font-scale")).toBe("1.25"),
    );
  });

  it.each([
    ["narrow", "60ch"],
    ["normal", "72ch"],
    ["wide", "90ch"],
  ] as const)("sets the %s line width as %s for the stylesheet (#13)", async (width, measure) => {
    const settings = createDefaultSettings();
    settings.preview.contentWidth = width;
    useSettingsStore.setState({ settings });
    render(<PreviewPane />);

    await waitFor(() =>
      expect(screen.getByTestId("preview-content").style.getPropertyValue("--preview-measure")).toBe(measure),
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

  it("keeps the rendered DOM when the pane re-renders without new content", async () => {
    // React 19 re-applies dangerouslySetInnerHTML when the { __html } object changes, which
    // would drop text selection, reload images and lose link focus on any re-render.
    renderMock.mockResolvedValue('<p><a href="https://example.com">a link</a></p>');
    render(<PreviewPane />);
    const link = await screen.findByRole("link", { name: "a link" });

    act(() => useSettingsStore.getState().updatePreview({ contentWidth: "wide" }));
    act(() => useSettingsStore.getState().updateAppearance({ previewFontScale: 1.25 }));

    expect(link.isConnected).toBe(true);
    expect(screen.getByRole("link", { name: "a link" })).toBe(link);
  });

  describe("links (#12)", () => {
    async function renderWithLink(href: string, text = "a link") {
      renderMock.mockResolvedValue(`<p><a href="${href}">${text}</a></p>`);
      render(<PreviewPane />);
      return screen.findByRole("link", { name: text });
    }

    function setOpenExternally(openLinksExternally: boolean) {
      const settings = createDefaultSettings();
      settings.preview.openLinksExternally = openLinksExternally;
      useSettingsStore.setState({ settings });
    }

    it("opens an https link in the system browser and keeps the app on its page", async () => {
      const link = await renderWithLink("https://example.com/docs");

      const notPrevented = fireEvent.click(link);

      expect(openExternalMock).toHaveBeenCalledWith("https://example.com/docs");
      expect(notPrevented).toBe(false); // preventDefault was called: the window can't navigate
    });

    it("opens mailto links too", async () => {
      const link = await renderWithLink("mailto:hi@example.com");

      fireEvent.click(link);

      expect(openExternalMock).toHaveBeenCalledWith("mailto:hi@example.com");
    });

    it("does nothing but still blocks navigation when the setting is off", async () => {
      setOpenExternally(false);
      const link = await renderWithLink("https://example.com");

      const notPrevented = fireEvent.click(link);

      expect(openExternalMock).not.toHaveBeenCalled();
      expect(notPrevented).toBe(false);
    });

    it("follows a changed setting without remounting", async () => {
      const link = await renderWithLink("https://example.com");

      act(() => useSettingsStore.getState().updatePreview({ openLinksExternally: false }));
      fireEvent.click(link);
      expect(openExternalMock).not.toHaveBeenCalled();

      act(() => useSettingsStore.getState().updatePreview({ openLinksExternally: true }));
      fireEvent.click(link);
      expect(openExternalMock).toHaveBeenCalledTimes(1);
    });

    it("never opens schemes other than web and mail, and blocks navigation to them", async () => {
      // tel: survives the sanitizer but isn't one of the schemes allowed to leave the app.
      const phone = await renderWithLink("tel:+123456", "phone link");

      const notPrevented = fireEvent.click(phone);

      expect(openExternalMock).not.toHaveBeenCalled();
      expect(notPrevented).toBe(false);
    });

    it("strips file: and javascript: hrefs before they can be clicked at all", async () => {
      renderMock.mockResolvedValue(
        '<p><a href="file:///C:/Windows/win.ini">f</a> <a href="javascript:alert(1)">j</a></p>',
      );
      render(<PreviewPane />);

      await waitFor(() => expect(screen.getByTestId("preview-content").querySelectorAll("a")).toHaveLength(2));

      expect(screen.queryAllByRole("link")).toHaveLength(0); // no href left, so not links
    });

    it("blocks relative links, which would replace the editor with a missing page", async () => {
      const link = await renderWithLink("./other.md");

      const notPrevented = fireEvent.click(link);

      expect(openExternalMock).not.toHaveBeenCalled();
      expect(notPrevented).toBe(false);
    });

    it("also handles the click when it lands on text inside the link", async () => {
      renderMock.mockResolvedValue('<p><a href="https://example.com"><strong>bold</strong> link</a></p>');
      render(<PreviewPane />);
      const inner = await screen.findByText("bold");

      fireEvent.click(inner);

      expect(openExternalMock).toHaveBeenCalledWith("https://example.com/");
    });

    it("blocks middle-click navigation as well", async () => {
      const link = await renderWithLink("https://example.com");

      const notPrevented = fireEvent(
        link,
        new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }),
      );

      expect(notPrevented).toBe(false);
    });

    it("scrolls to an in-page anchor without opening anything", async () => {
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      renderMock.mockResolvedValue('<p><a href="#section-two">jump</a></p><h2 id="section-two">Two</h2>');
      render(<PreviewPane />);
      const link = await screen.findByRole("link", { name: "jump" });

      fireEvent.click(link);

      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(openExternalMock).not.toHaveBeenCalled();
    });

    it("does nothing for an anchor that isn't on the page", async () => {
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      const link = await renderWithLink("#missing");

      fireEvent.click(link);

      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("ignores clicks that aren't on a link", async () => {
      renderMock.mockResolvedValue("<p>plain text</p>");
      render(<PreviewPane />);
      const text = await screen.findByText("plain text");

      const notPrevented = fireEvent.click(text);

      expect(notPrevented).toBe(true);
      expect(openExternalMock).not.toHaveBeenCalled();
    });

    it("keeps working if the system can't open the link", async () => {
      openExternalMock.mockRejectedValue(new Error("no handler"));
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const link = await renderWithLink("https://example.com");

      fireEvent.click(link);

      await waitFor(() => expect(consoleError).toHaveBeenCalled());
      consoleError.mockRestore();
    });
  });
});
