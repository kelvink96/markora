export interface AvailableUpdate {
  version: string;
  notes: string;
  publishedAt: string | null;
}

export interface DownloadProgress {
  downloaded: number;
  total: number | null;
}

export interface UpdateAdapter {
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
