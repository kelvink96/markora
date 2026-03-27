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
      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ghost-border)] bg-app-panel-strong px-2 py-1 shadow-[0_1px_0_rgba(255,255,255,0.75)_inset]"
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
