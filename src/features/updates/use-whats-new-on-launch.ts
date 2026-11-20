import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getUpdateAdapter } from "../../platform/updates";
import {
  clearPendingWhatsNew,
  loadPendingWhatsNew,
  type PendingWhatsNew,
} from "./whats-new-storage";

const stripLeadingV = (version: string) => version.replace(/^v/i, "");

/**
 * After an in-app update relaunches, announces the new version once with a quiet toast whose
 * action opens the release notes. Waits while `deferred` (Tour, Focus) so it never competes with them.
 */
export function useWhatsNewOnLaunch({ deferred }: { deferred: boolean }) {
  const [dialogRecord, setDialogRecord] = useState<PendingWhatsNew | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (deferred || handled.current) return;

    const record = loadPendingWhatsNew();
    if (!record) {
      handled.current = true;
      return;
    }

    // StrictMode runs this effect twice; the cleanup drops the first run's late result.
    let cancelled = false;
    void getUpdateAdapter()
      .getCurrentVersion()
      .then((current) => {
        if (cancelled || handled.current || current === null) return;
        handled.current = true;

        // Clear as soon as it is decided so the toast can never appear twice, even if the app closes first.
        clearPendingWhatsNew();
        if (stripLeadingV(record.version) !== stripLeadingV(current)) return;

        toast(`Updated to ${record.version}`, {
          description: "Markora is up to date.",
          duration: Infinity,
          action: record.notes.trim()
            ? { label: "What's new", onClick: () => setDialogRecord(record) }
            : undefined,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [deferred]);

  const closeDialog = useCallback(() => setDialogRecord(null), []);

  return { dialogRecord, closeDialog };
}
