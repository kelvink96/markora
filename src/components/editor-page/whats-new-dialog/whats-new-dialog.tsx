import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PendingWhatsNew } from "../../../platform/updates";
import { ReleaseNotes } from "../../settings-page/release-notes";

interface WhatsNewDialogProps {
  /** The release to describe; the dialog is open exactly while this is set. */
  record: PendingWhatsNew | null;
  onClose: () => void;
}

/** "Released 20 Nov 2026", or null when the release has no usable date. */
function releasedLabel(publishedAt: string | null): string | null {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Released ${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}

/** The release notes for the version the app just updated to, opened from the "Updated" toast. */
export function WhatsNewDialog({ record, onClose }: WhatsNewDialogProps) {
  const released = record ? releasedLabel(record.publishedAt) : null;

  return (
    <Dialog open={record !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        {record && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                What's new in {record.version}
                <span
                  aria-hidden="true"
                  className="rounded-full border border-primary/50 px-1.5 text-[0.65rem] font-semibold text-primary"
                >
                  Updated
                </span>
              </DialogTitle>
              <DialogDescription>{released ?? "Here is what changed in this release."}</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border bg-card px-3 py-2.5">
              <ReleaseNotes markdown={record.notes} />
            </div>
            <DialogFooter>
              <Button onClick={onClose}>Got it</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
