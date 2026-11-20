import { useCallback, useEffect, useState } from "react";
import { loadWorkspaceSnapshot, saveWorkspaceSnapshot } from "../../platform/persistence/web";
import { useWorkspaceState } from "../../features/workspace/workspace-state";
import { useDocumentStore } from "../../store/document";

interface DeferredInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** Web only: restores the saved workspace on load and saves it whenever it changes. */
export function useWebWorkspacePersistence(isWeb: boolean) {
  const projects = useDocumentStore((state) => state.projects);
  const activeProjectId = useDocumentStore((state) => state.activeProjectId);
  const recentDocuments = useDocumentStore((state) => state.recentDocuments);
  const hydrateWorkspace = useDocumentStore((state) => state.hydrateWorkspace);
  // Saving before the stored snapshot has been read would overwrite it with the empty initial state.
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!isWeb) {
      return;
    }

    loadWorkspaceSnapshot()
      .then((snapshot) => {
        if (!isActive || !snapshot) return;
        hydrateWorkspace(snapshot);
        // A stored workspace at startup means this is an upgrade, not a first run: keep raw syntax (the old Edit view).
        useWorkspaceState.getState().keepEditForPreexistingData();
      })
      .catch((error) => console.error("load_workspace_snapshot failed:", error))
      .finally(() => {
        if (isActive) setHasLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, [hydrateWorkspace, isWeb]);

  useEffect(() => {
    if (!isWeb || !hasLoaded) {
      return;
    }

    void saveWorkspaceSnapshot({
      version: 1,
      projects,
      activeProjectId,
      recentDocuments,
    }).catch((error) => console.error("save_workspace_snapshot failed:", error));
  }, [activeProjectId, hasLoaded, isWeb, projects, recentDocuments]);
}

/** Web only: captures the browser's install prompt so a button can trigger it later. */
export function useInstallPrompt(isWeb: boolean) {
  const [installPromptEvent, setInstallPromptEvent] = useState<DeferredInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as DeferredInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [isWeb]);

  const install = useCallback(async () => {
    if (!installPromptEvent) {
      return;
    }

    try {
      await installPromptEvent.prompt();
      await installPromptEvent.userChoice;
    } finally {
      setInstallPromptEvent(null);
    }
  }, [installPromptEvent]);

  return { canInstall: isWeb && installPromptEvent !== null, install };
}
