export interface LinkAdapter {
  /** Opens a URL in the user's default browser or mail app, outside Markora. */
  openExternal(url: string): Promise<void>;
}
