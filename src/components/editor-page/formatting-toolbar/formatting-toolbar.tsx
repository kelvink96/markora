import { IconButton } from "../../shared/icon-button";
import { ToolbarGroup } from "../../shared/toolbar-group";

interface FormattingToolbarProps {
  onHeading: () => void;
  onBold: () => void;
  onItalic: () => void;
  onStrike: () => void;
  onBulletList: () => void;
  onOrderedList: () => void;
  onTaskList: () => void;
  onQuote: () => void;
  onCodeBlock: () => void;
  onLink: () => void;
  onTable: () => void;
  onImage: () => void;
  disabled?: boolean;
}

export function FormattingToolbar({
  onHeading,
  onBold,
  onItalic,
  onStrike,
  onBulletList,
  onOrderedList,
  onTaskList,
  onQuote,
  onCodeBlock,
  onLink,
  onTable,
  onImage,
  disabled = false,
}: FormattingToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="inline-flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-[color:var(--ghost-border)] bg-app-panel-strong/94 px-2 py-1 shadow-[0_1px_0_rgba(255,255,255,0.75)_inset]"
    >
      <ToolbarGroup>
        <IconButton label="Heading" onClick={onHeading} disabled={disabled}>
          H1
        </IconButton>
      </ToolbarGroup>
      <ToolbarGroup>
        <IconButton label="Bold" onClick={onBold} disabled={disabled}>
          B
        </IconButton>
        <IconButton label="Italic" onClick={onItalic} disabled={disabled}>
          I
        </IconButton>
        <IconButton label="Strikethrough" onClick={onStrike} disabled={disabled}>
          S
        </IconButton>
      </ToolbarGroup>
      <ToolbarGroup>
        <IconButton label="Bullet list" onClick={onBulletList} disabled={disabled}>
          •
        </IconButton>
        <IconButton label="Numbered list" onClick={onOrderedList} disabled={disabled}>
          1.
        </IconButton>
        <IconButton label="Task list" onClick={onTaskList} disabled={disabled}>
          []
        </IconButton>
      </ToolbarGroup>
      <ToolbarGroup>
        <IconButton label="Quote" onClick={onQuote} disabled={disabled}>
          "
        </IconButton>
        <IconButton label="Code block" onClick={onCodeBlock} disabled={disabled}>
          {"</>"}
        </IconButton>
        <IconButton label="Link" onClick={onLink} disabled={disabled}>
          Link
        </IconButton>
        <IconButton label="Table" onClick={onTable} disabled={disabled}>
          Tbl
        </IconButton>
        <IconButton label="Image" onClick={onImage} disabled={disabled}>
          Img
        </IconButton>
      </ToolbarGroup>
    </div>
  );
}
