import { IconButton } from "../../shared/icon-button";
import { ToolbarGroup } from "../../shared/toolbar-group";

interface FormattingToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onList: () => void;
  disabled?: boolean;
}

export function FormattingToolbar({
  onBold,
  onItalic,
  onList,
  disabled = false,
}: FormattingToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="inline-flex items-center gap-2 rounded-[calc(var(--radius-md)-2px)] border border-[color:var(--ghost-border)] bg-app-panel-strong p-1.5 shadow-[0_10px_24px_rgba(24,34,43,0.08)]"
    >
      <ToolbarGroup>
        <IconButton label="Bold" onClick={onBold} disabled={disabled}>
          B
        </IconButton>
        <IconButton label="Italic" onClick={onItalic} disabled={disabled}>
          I
        </IconButton>
        <IconButton label="List" onClick={onList} disabled={disabled}>
          •
        </IconButton>
      </ToolbarGroup>
    </div>
  );
}
