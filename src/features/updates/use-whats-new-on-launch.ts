import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getUpdateAdapter, type PendingWhatsNew } from "../../platform/updates";

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

    // StrictMode runs this effect twice, and `deferred` can flip while we wait; the cleanup drops a
    // stale run's late result and the next run starts over, so nothing is lost or shown twice.
    let cancelled = false;
    void (async () => {
      const adapter = getUpdateAdapter();
      const record = await adapter.loadPendingWhatsNew();
      if (cancelled || handled.current) return;
      if (!record) {
        handled.current = true;
        return;
      }

      const current = await adapter.getCurrentVersion();
      if (cancelled || handled.current || !current) return;

      // Decided: from here the toast is never lost to a re-run, so the record can be cleared first.
      // Clearing as soon as it is decided means it can never appear twice, even if the app closes first.
      handled.current = true;
      await adapter.clearPendingWhatsNew().catch((error) => console.error("clear pending what's new failed:", error));
      if (stripLeadingV(record.version) !== stripLeadingV(current)) return;

      toast(`Updated to ${record.version}`, {
        description: "Markora is up to date.",
        duration: Infinity,
        action: record.notes.trim() ? { label: "What's new", onClick: () => setDialogRecord(record) } : undefined,
      });
    })().catch((error) => console.error("what's new on launch failed:", error));

    return () => {
      cancelled = true;
    };
  }, [deferred]);

  const closeDialog = useCallback(() => setDialogRecord(null), []);

  return { dialogRecord, closeDialog };
}
