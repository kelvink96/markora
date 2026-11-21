export interface AvailableUpdate {
  version: string;
  notes: string;
  publishedAt: string | null;
}

export interface DownloadProgress {
  downloaded: number;
  total: number | null;
}

/** What an in-app update remembers just before it installs, so the next launch can say what changed. */
export interface PendingWhatsNew {
  version: string;
  notes: string;
  publishedAt: string | null;
}

export interface UpdateAdapter {
  /** The version of the running app, or null when it is unknown (web, or the version cannot be read). */
  getCurrentVersion(): Promise<string | null>;
  /**
   * Persists the record durably before resolving: on Windows install() ends the app, so it has to be
   * on disk by then (the webview's own storage is flushed lazily and can be lost).
   */
  savePendingWhatsNew(record: PendingWhatsNew): Promise<void>;
  /** The saved record, or null when there is none or it cannot be read. */
  loadPendingWhatsNew(): Promise<PendingWhatsNew | null>;
  clearPendingWhatsNew(): Promise<void>;
  checkForUpdate(): Promise<AvailableUpdate | null>;
  /** Downloads the update returned by the last checkForUpdate() without installing it; rejects if there is none. */
  download(onProgress: (progress: DownloadProgress) => void): Promise<void>;
  /**
   * Installs the downloaded update; rejects if there is none.
   * On Windows this never resolves: the plugin launches the installer and exits the app.
   */
  install(): Promise<void>;
  relaunch(): Promise<void>;
}
