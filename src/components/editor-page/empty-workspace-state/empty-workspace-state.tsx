import { FilePlus2, FolderOpen } from "lucide-react";
import { Button } from "../../shared/button";

interface EmptyWorkspaceStateProps {
  onNewDocument: () => void;
  onOpenFile: () => void;
}

export function EmptyWorkspaceState({
  onNewDocument,
  onOpenFile,
}: EmptyWorkspaceStateProps) {
  return (
    <section className="flex min-h-full items-center justify-center px-6 py-10" aria-label="Empty workspace">
      <div className="flex w-full max-w-2xl flex-col items-center rounded-[28px] border border-[color:var(--glass-border-strong)] bg-[color:color-mix(in_srgb,var(--glass-panel-strong)_84%,var(--surface-panel-strong))] px-8 py-12 text-center shadow-[var(--shadow-soft)] backdrop-blur-[var(--glass-blur-strong)]">
        <div className="mb-5 inline-flex size-14 items-center justify-center rounded-full border border-[color:var(--glass-border)] bg-[color:color-mix(in_srgb,var(--accent)_14%,var(--surface-panel-strong))] text-[color:var(--accent-strong)]">
          <FilePlus2 className="size-6" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-app-text-muted">
          Workspace cleared
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-app-text">
          No document open
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-app-text-secondary">
          Create a blank note to keep writing, or open an existing markdown file to jump back in.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            variant="secondary"
            leftSection={<FilePlus2 className="size-4" />}
            onClick={onNewDocument}
          >
            New document
          </Button>
          <Button
            variant="secondary"
            leftSection={<FolderOpen className="size-4" />}
            onClick={onOpenFile}
          >
            Open file
          </Button>
        </div>
      </div>
    </section>
  );
}
