import { FilePlus2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { getModifierLabel } from "../../../features/shortcuts/modifier-label";

interface EmptyWorkspaceStateProps {
  onNewDocument: () => void;
  onOpenFile: () => void;
  openFileLabel?: string;
}

export function EmptyWorkspaceState({
  onNewDocument,
  onOpenFile,
  openFileLabel = "Open file",
}: EmptyWorkspaceStateProps) {
  const mod = getModifierLabel();

  return (
    <section className="flex min-h-full flex-1 items-center justify-center px-6 py-10" aria-label="Empty workspace">
      <div className="relative flex w-full max-w-xl flex-col items-center overflow-hidden rounded-3xl border bg-card/80 px-8 py-12 text-center shadow-xl backdrop-blur-sm">
        {/* A soft pool of the brand colours behind the icon; decorative, so hidden from assistive tech. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-linear-to-br from-brand-from to-brand-to opacity-20 blur-3xl"
        />
        <div className="relative mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-brand-from to-brand-to text-primary-foreground shadow-lg">
          <FilePlus2 className="size-7" aria-hidden="true" />
        </div>
        <h1 className="relative text-3xl font-semibold tracking-tight text-foreground">No document open</h1>
        <p className="relative mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Create a blank note to keep writing, or open an existing markdown file to jump back in.
        </p>
        <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" onClick={onNewDocument}>
            <FilePlus2 aria-hidden="true" /> New document
          </Button>
          <Button size="lg" variant="outline" onClick={onOpenFile}>
            <FolderOpen aria-hidden="true" /> {openFileLabel}
          </Button>
        </div>
        <p className="relative mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Kbd>{mod}+N</Kbd> new <span aria-hidden="true">·</span> <Kbd>{mod}+O</Kbd> open
        </p>
      </div>
    </section>
  );
}
