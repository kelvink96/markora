import { useEffect } from "react";
import { toast } from "sonner";
import type { FileAdapter } from "../../platform/files/types";
import { useDocumentStore } from "../../store/document";

/** The file name at the end of a path, for messages. Handles both slash styles. */
function baseName(path: string) {
  return path.split(/[\/]/).pop() || path;
}

/**
 * Desktop only. Opens files the operating system hands to the app: the ones it was
 * launched with ("Open with", double-click) and the ones a second launch forwards to this
 * already-running window. Each opens in its own tab and the last one is shown.
 *
 * `ready` holds this back until the previous session has been restored, so the opened
 * file is the one left on screen instead of being replaced by the restored active tab.
 */
export function useExternalOpen(fileAdapter: FileAdapter, ready: boolean) {
  const openDocument = useDocumentStore((state) => state.openDocument);

  useEffect(() => {
    if (!ready || !fileAdapter.takeLaunchPaths || !fileAdapter.onOpenFiles) return;
    const { takeLaunchPaths, onOpenFiles } = fileAdapter;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function openPaths(paths: string[]) {
      // One at a time, so the tabs keep the order the files were given in.
      for (const path of paths) {
        try {
          const content = await fileAdapter.readFile(path);
          openDocument({ content, filePath: path, isDirty: false });
        } catch (error) {
          console.error(`open ${path} failed:`, error);
          toast.error(`Could not open ${baseName(path)}`);
        }
      }
    }

    void (async () => {
      // Subscribe before draining, so a file arriving in between is not missed.
      const stop = await onOpenFiles((paths) => void openPaths(paths));
      if (cancelled) {
        stop();
        return;
      }
      unsubscribe = stop;
      await openPaths(await takeLaunchPaths());
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [fileAdapter, openDocument, ready]);
}
