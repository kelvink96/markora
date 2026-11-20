const STORAGE_KEY = "markora:pending-whats-new";

/** What an in-app update saves just before it installs, so the next launch can say what changed. */
export interface PendingWhatsNew {
  version: string;
  notes: string;
  publishedAt: string | null;
}

/** Reads the saved record; anything missing, corrupt or the wrong shape is no record. */
export function loadPendingWhatsNew(): PendingWhatsNew | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const { version, notes, publishedAt } = parsed as Record<string, unknown>;
    if (typeof version !== "string" || version.length === 0) return null;

    return {
      version,
      notes: typeof notes === "string" ? notes : "",
      publishedAt: typeof publishedAt === "string" ? publishedAt : null,
    };
  } catch {
    return null;
  }
}

export function savePendingWhatsNew(record: PendingWhatsNew) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage can be full or blocked; missing the what's new toast is better than blocking the update.
  }
}

export function clearPendingWhatsNew() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Same as save: nothing useful to do if storage is unavailable.
  }
}
