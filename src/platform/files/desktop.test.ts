import { beforeEach, describe, expect, it, vi } from "vitest";
import { desktopFileAdapter } from "./desktop";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock("@tauri-apps/api/core", () => ({ invoke: invokeMock }));

describe("desktopFileAdapter", () => {
  beforeEach(() => invokeMock.mockReset());

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
});
