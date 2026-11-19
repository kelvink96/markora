import { beforeEach, describe, expect, it, vi } from "vitest";
import { desktopFileAdapter } from "./desktop";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

const { listenMock } = vi.hoisted(() => ({ listenMock: vi.fn() }));

vi.mock("@tauri-apps/api/core", () => ({ invoke: invokeMock }));
vi.mock("@tauri-apps/api/event", () => ({ listen: listenMock }));

describe("desktopFileAdapter", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    listenMock.mockReset();
  });

  it("opens the file picker through Rust so the path is allowlisted (#21)", async () => {
    invokeMock.mockResolvedValue("/notes/today.md");

    await expect(desktopFileAdapter.pickOpenPath()).resolves.toBe("/notes/today.md");
    expect(invokeMock).toHaveBeenCalledWith("pick_open_path");
  });

  it("asks for another file type when exporting (#15)", async () => {
    invokeMock.mockResolvedValue("/out/notes.html");

    await desktopFileAdapter.pickSavePath("notes.html", { filterName: "HTML", extensions: ["html"] });

    expect(invokeMock).toHaveBeenCalledWith("pick_save_path", {
      defaultPath: "notes.html",
      extensions: ["html"],
      filterName: "HTML",
    });
  });

  it("opens the save picker through Rust with the suggested file name (#21)", async () => {
    invokeMock.mockResolvedValue(null);

    await expect(desktopFileAdapter.pickSavePath("untitled.md")).resolves.toBeNull();
    expect(invokeMock).toHaveBeenCalledWith("pick_save_path", { defaultPath: "untitled.md" });
  });

  it("collects the files the app was launched with from Rust", async () => {
    invokeMock.mockResolvedValue(["/notes/today.md"]);

    await expect(desktopFileAdapter.takeLaunchPaths?.()).resolves.toEqual(["/notes/today.md"]);
    expect(invokeMock).toHaveBeenCalledWith("take_pending_open_paths");
  });

  it("passes files forwarded by a second launch to the handler", async () => {
    const unlisten = vi.fn();
    listenMock.mockResolvedValue(unlisten);
    const handler = vi.fn();

    const stop = await desktopFileAdapter.onOpenFiles?.(handler);
    const [eventName, callback] = listenMock.mock.calls[0];
    callback({ payload: ["/notes/other.md"] });

    expect(eventName).toBe("open-files");
    expect(handler).toHaveBeenCalledWith(["/notes/other.md"]);
    expect(stop).toBe(unlisten);
  });
});
