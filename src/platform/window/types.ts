export interface WindowAdapter {
  /**
   * True when Markora draws its own title bar (the desktop window has no OS decorations).
   * The browser owns its window, so the web build draws no window controls.
   */
  readonly hasCustomTitleBar: boolean;
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  /** Asks the window to close, exactly as the OS close button would. */
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
  /** Opens the Windows 11 Snap Layouts flyout, which the OS only offers on its own maximise button. */
  showSnapLayouts(): Promise<void>;
  /** Calls `listener` whenever the window is resized (which includes maximise and restore). Returns an unsubscribe. */
  onResized(listener: () => void): Promise<() => void>;
}
