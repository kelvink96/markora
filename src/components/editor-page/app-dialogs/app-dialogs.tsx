import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink } from "../../external-link";
import { ShortcutKeys } from "../../shortcut-keys";
import { getModifierLabel } from "../../../features/shortcuts/modifier-label";
import type { PendingCloseRequest } from "../../../app/hooks";

interface AppDialogsProps {
  version: string;
  pendingCloseRequest: PendingCloseRequest;
  onCancelClose: () => void;
  onConfirmClose: () => void;
  shortcutsOpen: boolean;
  onShortcutsOpenChange: (open: boolean) => void;
  aboutOpen: boolean;
  onAboutOpenChange: (open: boolean) => void;
  releaseNotesOpen: boolean;
  onReleaseNotesOpenChange: (open: boolean) => void;
}

/** The app's modal dialogs: discarding unsaved changes, keyboard shortcuts, About and release notes. */
export function AppDialogs({
  version,
  pendingCloseRequest,
  onCancelClose,
  onConfirmClose,
  shortcutsOpen,
  onShortcutsOpenChange,
  aboutOpen,
  onAboutOpenChange,
  releaseNotesOpen,
  onReleaseNotesOpenChange,
}: AppDialogsProps) {
  const mod = getModifierLabel();
  const shortcuts: Array<[string, string[]]> = [
    ["Create a new document", [`${mod}+N`]],
    ["Open an existing file", [`${mod}+O`]],
    ["Save the current document", [`${mod}+S`]],
    ["Save As", [`${mod}+Shift+S`]],
    ["Open the command palette", [`${mod}+K`, `${mod}+Shift+P`]],
    ["Find in the document", [`${mod}+F`]],
    ["Find and replace", [`${mod}+H`]],
    ["Next tab", ["Ctrl+Tab"]],
    ["Previous tab", ["Ctrl+Shift+Tab"]],
  ];
  const closingAll = pendingCloseRequest?.type === "all";

  return (
    <>
      {/* AlertDialog, not Dialog: it needs an explicit answer, and screen readers announce it as an alert. */}
      <AlertDialog
        open={pendingCloseRequest !== null}
        onOpenChange={(open) => {
          if (!open) onCancelClose();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              {closingAll
                ? "Some open documents have unsaved edits. Discard them and close every tab?"
                : "This document has unsaved edits. Discard them and close the tab?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            {closingAll
              ? "Closing all tabs will remove any unsaved changes across your open documents."
              : "Closing this tab will remove any unsaved changes in the current document."}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* preventDefault stops Radix closing the dialog itself (which would also report a cancel);
                confirming clears the request in the parent, and that closes it. */}
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={(event) => {
                event.preventDefault();
                onConfirmClose();
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={shortcutsOpen} onOpenChange={onShortcutsOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Quick shortcuts for the current editor workflow.</DialogDescription>
          </DialogHeader>
          <dl className="divide-y text-sm">
            {shortcuts.map(([action, keys]) => (
              <div key={action} className="flex items-center justify-between py-2">
                <dt>{action}</dt>
                <dd className="flex items-center gap-2">
                  {keys.map((key) => (
                    <ShortcutKeys key={key} shortcut={key} />
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aboutOpen} onOpenChange={onAboutOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About Markora</DialogTitle>
            <DialogDescription>A desktop-first markdown editor built with Tauri, React, and CodeMirror.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-start gap-2 text-sm">
            <p>Version {version}</p>
            <p className="text-muted-foreground">
              Markora keeps writing and reading in dedicated modes for a focused markdown workflow.
            </p>
            <ExternalLink href="https://kelvink96.github.io/markora/privacy">Privacy Policy</ExternalLink>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={releaseNotesOpen} onOpenChange={onReleaseNotesOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Notes</DialogTitle>
            <DialogDescription>{`Version ${version}`}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-start gap-2 text-sm">
            <p>Release notes are available on the releases page.</p>
            <ExternalLink href="https://kelvink96.github.io/markora/versions">View all releases</ExternalLink>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
