import { describe, expect, it, vi } from "vitest";
import { createLinkOpener } from "./link-opener";

function setup(openExternally: boolean) {
  const adapter = { openExternal: vi.fn().mockResolvedValue(undefined) };
  return { adapter, open: createLinkOpener(() => openExternally, adapter) };
}

describe("createLinkOpener", () => {
  it("opens web and mail links through the platform adapter when the setting is on", () => {
    const { adapter, open } = setup(true);
    open("https://example.com/");
    open("mailto:a@b.co");
    expect(adapter.openExternal.mock.calls).toEqual([["https://example.com/"], ["mailto:a@b.co"]]);
  });

  it("does nothing when 'Open links in your browser' is off", () => {
    const { adapter, open } = setup(false);
    open("https://example.com/");
    expect(adapter.openExternal).not.toHaveBeenCalled();
  });

  it("never opens other schemes or relative paths", () => {
    const { adapter, open } = setup(true);
    for (const href of ["javascript:alert(1)", "file:///etc/passwd", "./other.md", "#top", ""]) open(href);
    expect(adapter.openExternal).not.toHaveBeenCalled();
  });

  it("logs rather than throws when opening fails", async () => {
    const adapter = { openExternal: vi.fn().mockRejectedValue(new Error("nope")) };
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    createLinkOpener(() => true, adapter)("https://example.com/");
    await Promise.resolve();
    await Promise.resolve();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
