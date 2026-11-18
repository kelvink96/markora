import type { WorkspaceViewMode } from "./workspace-state";

const VIEW_MODE_STORAGE_KEY = "markora:view-mode";

/**
 * Storage written by earlier versions. Their presence means this is not a fresh install, so a
 * user with no saved mode keeps the Edit view they have always had instead of being moved to Live.
 */
const EXISTING_INSTALL_KEYS = ["markora:session", "markora:web-settings"];

const VIEW_MODES: readonly WorkspaceViewMode[] = ["live", "edit", "split", "preview"];

function isViewMode(value: unknown): value is WorkspaceViewMode {
  return VIEW_MODES.includes(value as WorkspaceViewMode);
}

/**
 * The view mode to start in: the last one used; otherwise Edit for existing users (who never
 * had a saved mode) and Live for brand-new installs. Works the same on web and desktop, since
 * both run in a webview with localStorage.
 */
export function loadViewMode(): WorkspaceViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (isViewMode(stored)) return stored;

    return EXISTING_INSTALL_KEYS.some((key) => localStorage.getItem(key) !== null) ? "edit" : "live";
  } catch {
    return "live";
  }
}

export function saveViewMode(mode: WorkspaceViewMode) {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // Storage can be full or blocked; forgetting the mode is better than crashing the app.
  }
}
