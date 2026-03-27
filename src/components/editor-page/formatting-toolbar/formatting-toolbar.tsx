import { IconButton } from "../../shared/icon-button";
import { ToolbarGroup } from "../../shared/toolbar-group";
import "./formatting-toolbar.css";

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
  );
}
