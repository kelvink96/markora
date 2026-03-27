import "./document-status.css";

interface DocumentStatusProps {
  fileName: string;
  isDirty: boolean;
}

export function DocumentStatus({ fileName, isDirty }: DocumentStatusProps) {
  return (
    <div className="document-status" aria-label="Document status">
      <div className="document-status__eyebrow">Current document</div>
      <div className="document-status__name">{fileName}</div>
      <div className="document-status__meta">
        {isDirty ? <span className="document-status__dirty">Unsaved changes</span> : "Saved"}
      </div>
    </div>
  );
}
