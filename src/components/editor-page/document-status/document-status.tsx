interface DocumentStatusProps {
  fileName: string;
  isDirty: boolean;
}

export function DocumentStatus({ fileName, isDirty }: DocumentStatusProps) {
  return (
    <div role="group" aria-label="Document status" className="flex min-w-0 items-baseline gap-2.5">
      <div className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-app-text">
        {fileName}
      </div>
      <div className="text-[0.83rem] font-medium text-app-text-secondary">
        {isDirty ? (
          <span className="inline-flex items-center gap-1.5 text-app-text-secondary">
            <span aria-hidden className="size-2 rounded-full bg-app-accent" />
            <span>Unsaved changes</span>
          </span>
        ) : (
          "Saved"
        )}
      </div>
    </div>
  );
}
