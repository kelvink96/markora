import { beforeEach, describe, expect, it, vi } from "vitest";
import { desktopWindowAdapter } from "./desktop";
import { webWindowAdapter } from "./web";

const { windowMock, invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(async () => {}),
  windowMock: {
    setFocus: vi.fn(async () => {}),
    minimize: vi.fn(async () => {}),
    toggleMaximize: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    isMaximized: vi.fn(async () => true),
    onResized: vi.fn(async (_handler: () => void) => () => {}),
  },
}));

vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => windowMock }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: invokeMock }));

describe("desktopWindowAdapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("draws its own title bar", () => {
    expect(desktopWindowAdapter.hasCustomTitleBar).toBe(true);
  });

  it("forwards the caption actions to the current Tauri window", async () => {
    await desktopWindowAdapter.minimize();
    await desktopWindowAdapter.toggleMaximize();
    await desktopWindowAdapter.close();

    expect(windowMock.minimize).toHaveBeenCalledOnce();
    expect(windowMock.toggleMaximize).toHaveBeenCalledOnce();
    expect(windowMock.close).toHaveBeenCalledOnce();
  });

  it("reports the maximised state", async () => {
    await expect(desktopWindowAdapter.isMaximized()).resolves.toBe(true);
  });

  it("opens the Snap Layouts flyout on the focused window", async () => {
    await desktopWindowAdapter.showSnapLayouts();

    expect(windowMock.setFocus).toHaveBeenCalledOnce();
    expect(invokeMock).toHaveBeenCalledWith("plugin:decorum|show_snap_overlay");
    // The flyout opens for whichever window has focus, so focus has to come first.
    expect(windowMock.setFocus.mock.invocationCallOrder[0]).toBeLessThan(invokeMock.mock.invocationCallOrder[0]);
  });

  it("calls the listener on every resize", async () => {
    const listener = vi.fn();
    await desktopWindowAdapter.onResized(listener);

    const handler = windowMock.onResized.mock.calls[0][0];
    handler();
    expect(listener).toHaveBeenCalledOnce();
  });
});

describe("webWindowAdapter", () => {
  it("leaves the window to the browser", async () => {
    expect(webWindowAdapter.hasCustomTitleBar).toBe(false);
    await expect(webWindowAdapter.isMaximized()).resolves.toBe(false);
  });
});
