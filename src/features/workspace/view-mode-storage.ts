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

/** Set while the stored mode is only the launch default, not something the user picked. */
const DEFAULT_MARKER_KEY = "markora:view-mode-default";

/** True when this launch had to pick a default, the only launch where older data can still be detected. */
let defaultedThisLaunch = false;

/**
 * The view mode to start in: the last one used; otherwise Edit for existing users (who never
 * had a saved mode) and Live for brand-new installs. Works the same on web and desktop, since
 * both run in a webview with localStorage. The chosen default is written back, so a later
 * launch never reclassifies the install (a new user who has since saved a session stays on Live).
 */
export function loadViewMode(): WorkspaceViewMode {
  defaultedThisLaunch = false;
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (isViewMode(stored)) return stored;

    const mode = EXISTING_INSTALL_KEYS.some((key) => localStorage.getItem(key) !== null) ? "edit" : "live";
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    localStorage.setItem(DEFAULT_MARKER_KEY, "1");
    defaultedThisLaunch = true;
    return mode;
  } catch {
    return "live";
  }
}

/**
 * The localStorage keys above are missing for many existing users (desktop settings live in a
 * file, the web workspace in IndexedDB), so callers that can see that older data call this once
 * it is found. If this launch only defaulted to Live and the user has not picked a mode since,
 * the default becomes Edit and is returned; otherwise `null`.
 */
export function keepEditForPreexistingData(): WorkspaceViewMode | null {
  if (!defaultedThisLaunch) return null;
  try {
    if (localStorage.getItem(DEFAULT_MARKER_KEY) !== "1") return null;
    if (localStorage.getItem(VIEW_MODE_STORAGE_KEY) !== "live") return null;
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, "edit");
    defaultedThisLaunch = false;
    return "edit";
  } catch {
    return null;
  }
}

export function saveViewMode(mode: WorkspaceViewMode) {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    localStorage.removeItem(DEFAULT_MARKER_KEY);
  } catch {
    // Storage can be full or blocked; forgetting the mode is better than crashing the app.
  }
}
