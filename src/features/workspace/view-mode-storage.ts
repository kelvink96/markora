import type { WorkspaceViewMode } from "./workspace-state";

const VIEW_MODE_STORAGE_KEY = "markora:view-mode";
const SHOW_SYNTAX_STORAGE_KEY = "markora:show-syntax";

/**
 * Storage written by earlier versions. Their presence means this is not a fresh install, so a
 * user with no saved mode keeps raw markdown (Show syntax on) instead of being moved to rendered Write.
 */
const EXISTING_INSTALL_KEYS = ["markora:session", "markora:web-settings"];

const VIEW_MODES: readonly WorkspaceViewMode[] = ["write", "split", "read"];

function isViewMode(value: unknown): value is WorkspaceViewMode {
  return VIEW_MODES.includes(value as WorkspaceViewMode);
}

/**
 * The four-mode values written before Write/Read existed. Live and Edit were the same pane with and
 * without inline rendering, so they become Write with Show syntax off and on; `syntax` is left out
 * for the modes that never had that choice.
 */
const LEGACY_MODES: Record<string, { mode: WorkspaceViewMode; syntax?: boolean }> = {
  live: { mode: "write", syntax: false },
  edit: { mode: "write", syntax: true },
  split: { mode: "split" },
  preview: { mode: "read" },
};

export interface ViewState {
  viewMode: WorkspaceViewMode;
  showSyntax: boolean;
}

/** Set while the stored state is only the launch default, not something the user picked. */
const DEFAULT_MARKER_KEY = "markora:view-mode-default";

/** True when this launch had to pick a default, the only launch where older data can still be detected. */
let defaultedThisLaunch = false;

function isExistingInstall(): boolean {
  return EXISTING_INSTALL_KEYS.some((key) => localStorage.getItem(key) !== null);
}

function store(mode: WorkspaceViewMode, showSyntax: boolean) {
  localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  localStorage.setItem(SHOW_SYNTAX_STORAGE_KEY, showSyntax ? "1" : "0");
}

/**
 * The view to start in: the last one used. Older four-mode values are migrated and written back in the
 * new form. With nothing stored, existing users (who never had a saved mode) get Write with raw syntax,
 * as they have always had, and brand-new installs get Write with syntax off. Works the same on web and
 * desktop, since both run in a webview with localStorage. The chosen default is written back, so a
 * later launch never reclassifies the install (a new user who has since saved a session stays rendered).
 */
export function loadViewState(): ViewState {
  defaultedThisLaunch = false;
  try {
    const storedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    const storedSyntax = localStorage.getItem(SHOW_SYNTAX_STORAGE_KEY);
    const existingInstall = isExistingInstall();
    const syntaxOrDefault = storedSyntax === null ? existingInstall : storedSyntax === "1";

    if (isViewMode(storedMode)) return { viewMode: storedMode, showSyntax: syntaxOrDefault };

    const legacy = storedMode === null ? undefined : LEGACY_MODES[storedMode];
    if (legacy) {
      const showSyntax = legacy.syntax ?? syntaxOrDefault;
      store(legacy.mode, showSyntax);
      return { viewMode: legacy.mode, showSyntax };
    }

    store("write", existingInstall);
    localStorage.setItem(DEFAULT_MARKER_KEY, "1");
    defaultedThisLaunch = true;
    return { viewMode: "write", showSyntax: existingInstall };
  } catch {
    return { viewMode: "write", showSyntax: false };
  }
}

/**
 * The localStorage keys above are missing for many existing users (desktop settings live in a
 * file, the web workspace in IndexedDB), so callers that can see that older data call this once
 * it is found. If this launch only defaulted and the user has not picked anything since, Show syntax
 * is turned on (what they have always had) and `true` is returned; otherwise `false`.
 */
export function keepEditForPreexistingData(): boolean {
  if (!defaultedThisLaunch) return false;
  try {
    if (localStorage.getItem(DEFAULT_MARKER_KEY) !== "1") return false;
    if (localStorage.getItem(SHOW_SYNTAX_STORAGE_KEY) !== "0") return false;
    localStorage.setItem(SHOW_SYNTAX_STORAGE_KEY, "1");
    defaultedThisLaunch = false;
    return true;
  } catch {
    return false;
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

export function saveShowSyntax(showSyntax: boolean) {
  try {
    localStorage.setItem(SHOW_SYNTAX_STORAGE_KEY, showSyntax ? "1" : "0");
    localStorage.removeItem(DEFAULT_MARKER_KEY);
  } catch {
    // As above: a forgotten preference is better than a crash.
  }
}
