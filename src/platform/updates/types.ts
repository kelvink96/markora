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
  /** Installs the update returned by the last checkForUpdate(); rejects if there is none. */
  downloadAndInstall(onProgress: (progress: DownloadProgress) => void): Promise<void>;
  relaunch(): Promise<void>;
}
