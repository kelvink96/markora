import { useEffect, useRef, useState } from "react";
import { loadSession, saveSession } from "../../features/session/session-storage";
import { useSettingsStore } from "../../features/settings/settings-store";
import type { FileAdapter } from "../../platform/files/types";
import { useDocumentStore } from "../../store/document";

/**
 * Desktop only. With "Restore previous session" on, reopens the files that were open last
 * time (and re-selects the active one), and keeps the saved list up to date as tabs change.
 *
 * On web the workspace itself is stored in the browser, so there is nothing to reopen.
 *
 * Returns whether restoring has finished (always true on web).
 */
export function useSessionRestore(fileAdapter: FileAdapter, isDesktop: boolean) {
  const settingsLoaded = useSettingsStore((state) => state.isHydrated);
  const restoreEnabled = useSettingsStore((state) => state.settings.files.restorePreviousSession);
  const openDocument = useDocumentStore((state) => state.openDocument);
  const selectDocument = useDocumentStore((state) => state.selectDocument);
  // Saving is held back until restoring has finished: the app starts with no tabs, and
  // saving that would overwrite the session before it could be read.
  const [restoreFinished, setRestoreFinished] = useState(!isDesktop);
  const attempted = useRef(false);

  // A string, so this only changes when the set of open files or the active file changes,
  // not on every keystroke.
  const currentSession = useDocumentStore((state) =>
    JSON.stringify({
      openPaths: state.openDocuments.flatMap((document) => (document.filePath ? [document.filePath] : [])),
      activePath: state.filePath,
    }),
  );

  useEffect(() => {
    // Wait for the settings to load; until then we don't know whether restore is on.
    if (!isDesktop || !settingsLoaded || attempted.current) return;
    attempted.current = true;

    if (!restoreEnabled) {
      setRestoreFinished(true);
      return;
    }

    void (async () => {
      const { openPaths, activePath } = loadSession();

      for (const path of openPaths) {
        try {
          const content = await fileAdapter.readFile(path);
          openDocument({ content, filePath: path, isDirty: false });
        } catch (error) {
          // Moved, deleted or no longer permitted: skip it rather than block the launch.
          console.warn(`could not restore ${path}:`, error);
        }
      }

      if (activePath) {
        const { openDocuments } = useDocumentStore.getState();
        const active = openDocuments.find((document) => document.filePath === activePath);
        if (active) selectDocument(active.id);
      }

      setRestoreFinished(true);
    })();
  }, [fileAdapter, isDesktop, openDocument, restoreEnabled, selectDocument, settingsLoaded]);

  useEffect(() => {
    if (!isDesktop || !restoreFinished || !restoreEnabled) return;

    saveSession(JSON.parse(currentSession));
  }, [currentSession, isDesktop, restoreEnabled, restoreFinished]);

  return restoreFinished;
}
