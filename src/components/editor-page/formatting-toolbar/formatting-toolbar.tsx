import { IconButton } from "../../shared/icon-button";
import { ToolbarGroup } from "../../shared/toolbar-group";
import "./formatting-toolbar.css";

interface FormattingToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onList: () => void;
}

export function FormattingToolbar({ onBold, onItalic, onList }: FormattingToolbarProps) {
  return (
    <ToolbarGroup>
      <IconButton label="Bold" onClick={onBold}>
        B
      </IconButton>
      <IconButton label="Italic" onClick={onItalic}>
        I
      </IconButton>
      <IconButton label="List" onClick={onList}>
        •
      </IconButton>
    </ToolbarGroup>
  );
}
