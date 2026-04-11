import { beforeEach, describe, expect, it, vi } from "vitest";
import { webFileAdapter } from "./web";

describe("webFileAdapter", () => {
  beforeEach(() => {
    delete window.showDirectoryPicker;
    vi.restoreAllMocks();
  });

  it("reports directory access support only when the browser exposes it", () => {
    expect(webFileAdapter.supportsDirectoryAccess()).toBe(false);

    window.showDirectoryPicker = vi.fn();

    expect(webFileAdapter.supportsDirectoryAccess()).toBe(true);
  });

  it("reports browser import and export support", () => {
    expect(webFileAdapter.supportsFileImport()).toBe(true);
    expect(webFileAdapter.supportsFileExport()).toBe(true);
  });

  it("loads markdown files from a selected directory", async () => {
    const notesHandle = {
      kind: "file",
      name: "notes.md",
      getFile: vi.fn().mockResolvedValue(new File(["# Notes"], "notes.md", { type: "text/markdown" })),
    } as unknown as FileSystemFileHandle;

    const nestedHandle = {
      kind: "directory",
      name: "nested",
      values: async function* () {
        yield {
          kind: "file",
          name: "todo.md",
          getFile: vi.fn().mockResolvedValue(new File(["- [ ] Ship"], "todo.md", { type: "text/markdown" })),
        } as unknown as FileSystemFileHandle;
      },
    } as unknown as FileSystemDirectoryHandle;

    window.showDirectoryPicker = vi.fn().mockResolvedValue({
      kind: "directory",
      name: "workspace",
      values: async function* () {
        yield notesHandle;
        yield nestedHandle;
        yield {
          kind: "file",
          name: "ignore.png",
          getFile: vi.fn().mockResolvedValue(new File(["ignore"], "ignore.png", { type: "image/png" })),
        } as unknown as FileSystemFileHandle;
      },
    } as unknown as FileSystemDirectoryHandle);

    const snapshot = await webFileAdapter.openDirectory?.();

    expect(snapshot).toEqual({
      name: "workspace",
      handle: expect.any(Object),
      files: [
        {
          name: "notes.md",
          path: "notes.md",
          content: "# Notes",
          handle: notesHandle,
        },
        {
          name: "todo.md",
          path: "nested/todo.md",
          content: "- [ ] Ship",
          handle: expect.any(Object),
        },
      ],
    });
  });

  it("imports selected markdown files from a browser file picker", async () => {
    const originalCreateElement = document.createElement.bind(document);
    const addEventListener = vi.fn();
    const click = vi.fn();
    const input = {
      type: "",
      multiple: false,
      accept: "",
      files: [
        new File(["# Notes"], "notes.md", { type: "text/markdown" }),
        new File(["Ignore"], "image.png", { type: "image/png" }),
      ],
      addEventListener,
      click,
    } as unknown as HTMLInputElement;

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "input") {
        return input;
      }

      return originalCreateElement(tagName);
    });

    addEventListener.mockImplementation((_event, handler: () => void) => {
      handler();
    });

    const files = await webFileAdapter.importFiles?.();

    expect(click).toHaveBeenCalled();
    expect(files).toEqual([
      {
        name: "notes.md",
        path: "notes.md",
        content: "# Notes",
      },
    ]);
  });

  it("writes updated content back through a file handle", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const createWritable = vi.fn().mockResolvedValue({ write, close });

    await webFileAdapter.writeWorkspaceFile?.(
      {
        kind: "file",
        name: "notes.md",
        getFile: vi.fn(),
        createWritable,
      } as unknown as FileSystemFileHandle,
      "# Updated",
    );

    expect(createWritable).toHaveBeenCalled();
    expect(write).toHaveBeenCalledWith("# Updated");
    expect(close).toHaveBeenCalled();
  });

  it("exports content as a downloadable markdown file", async () => {
    const originalCreateElement = document.createElement.bind(document);
    const click = vi.fn();
    const createObjectURL = vi.fn().mockReturnValue("blob:markora");
    const revokeObjectURL = vi.fn();
    const anchor = {
      href: "",
      download: "",
      click,
    } as unknown as HTMLAnchorElement;

    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return anchor;
      }

      return originalCreateElement(tagName);
    });

    await webFileAdapter.exportFile?.("notes.md", "# Exported");

    expect(createObjectURL).toHaveBeenCalled();
    expect(anchor.download).toBe("notes.md");
    expect(anchor.href).toBe("blob:markora");
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:markora");
  });
});
