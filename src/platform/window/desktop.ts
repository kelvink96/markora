import type { WindowAdapter } from "./types";

// Loaded lazily, like the other desktop adapters, so the web bundle never pulls in Tauri's window API.
async function currentWindow() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

export const desktopWindowAdapter: WindowAdapter = {
  // tauri.conf.json turns the OS decorations off, so the app's top bar is the title bar.
  hasCustomTitleBar: true,

  async minimize() {
    await (await currentWindow()).minimize();
  },

  async toggleMaximize() {
    await (await currentWindow()).toggleMaximize();
  },

  async close() {
    await (await currentWindow()).close();
  },

  async isMaximized() {
    return (await currentWindow()).isMaximized();
  },

  async showSnapLayouts() {
    // tauri-plugin-decorum opens the flyout by pressing Win+Z, which acts on the focused window,
    // so focus this one first. On macOS and Linux the command does nothing.
    await (await currentWindow()).setFocus();
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("plugin:decorum|show_snap_overlay");
  },

  async onResized(listener) {
    return (await currentWindow()).onResized(() => listener());
  },
};
