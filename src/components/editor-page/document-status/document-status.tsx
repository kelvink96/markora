import { StatusBadge } from "../../shared/status-badge";
import { Title } from "../../shared/title";

interface DocumentStatusProps {
  fileName: string;
  isDirty: boolean;
}

export function DocumentStatus({ fileName, isDirty }: DocumentStatusProps) {
  return (
    <div role="group" aria-label="Document status" className="flex min-w-0 items-baseline gap-2.5">
      <Title as="h2" size="sm" truncate className="text-[1.05rem]">
        {fileName}
      </Title>
      <div className="text-[0.83rem] font-medium text-app-text-secondary">
        {isDirty ? (
          <StatusBadge tone="warning" className="gap-1.5 px-2 py-1 text-[0.72rem] tracking-[0.08em]">
            <span aria-hidden className="size-2 rounded-full bg-app-accent" />
            <span>Unsaved changes</span>
          </StatusBadge>
        ) : (
          <StatusBadge tone="success" className="px-2 py-1 text-[0.72rem] tracking-[0.08em]">
            Saved
          </StatusBadge>
        )}
      </div>
    </div>
  );
}
