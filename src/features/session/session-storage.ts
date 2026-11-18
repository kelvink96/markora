const SESSION_STORAGE_KEY = "markora:session";

/** The files open when the app last ran, so the next launch can reopen them. */
export interface SavedSession {
  openPaths: string[];
  activePath: string | null;
}

const emptySession = (): SavedSession => ({ openPaths: [], activePath: null });

/** Reads the saved session; anything missing, corrupt or the wrong shape is an empty session. */
export function loadSession(): SavedSession {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return emptySession();

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptySession();

    const { openPaths, activePath } = parsed as Record<string, unknown>;
    const paths = Array.isArray(openPaths)
      ? openPaths.filter((path): path is string => typeof path === "string" && path.length > 0)
      : [];

    return {
      // Duplicates would open the same file twice.
      openPaths: [...new Set(paths)],
      activePath: typeof activePath === "string" && paths.includes(activePath) ? activePath : null,
    };
  } catch {
    return emptySession();
  }
}

export function saveSession(session: SavedSession) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be full or blocked; losing the session is better than crashing the app.
  }
}
