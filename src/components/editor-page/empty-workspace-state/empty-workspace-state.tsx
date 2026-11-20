import { FilePlus2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getModifierLabel } from "../../../features/shortcuts/modifier-label";
import { ShortcutKeys } from "../../shortcut-keys";

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
      {/* The app's welcome card: Empty's layout, with the brand surface on top of it. */}
      <Empty className="relative w-full max-w-xl flex-none overflow-hidden rounded-3xl border border-solid bg-card/80 px-8 py-12 shadow-xl backdrop-blur-sm md:px-8 md:py-12">
        {/* A soft pool of the brand colours behind the icon; decorative, so hidden from assistive tech. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-linear-to-br from-brand-from to-brand-to opacity-20 blur-3xl"
        />
        <EmptyHeader className="relative max-w-md">
          <EmptyMedia className="mb-4 size-16 rounded-2xl bg-linear-to-br from-brand-from to-brand-to text-primary-foreground shadow-lg">
            <FilePlus2 className="size-7" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle role="heading" aria-level={1} className="text-3xl font-semibold text-foreground">
            No document open
          </EmptyTitle>
          <EmptyDescription className="leading-6">
            Create a blank note, or open an existing markdown file. Everything stays on this device.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="relative max-w-none gap-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" onClick={onNewDocument}>
              <FilePlus2 aria-hidden="true" /> New document
            </Button>
            <Button size="lg" variant="outline" onClick={onOpenFile}>
              <FolderOpen aria-hidden="true" /> {openFileLabel}
            </Button>
          </div>
          <p className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShortcutKeys shortcut={`${mod}+N`} /> new <span aria-hidden="true">·</span> <ShortcutKeys shortcut={`${mod}+O`} /> open{" "}
            <span aria-hidden="true">·</span> <ShortcutKeys shortcut={`${mod}+K`} /> commands
          </p>
        </EmptyContent>
      </Empty>
    </section>
  );
}
