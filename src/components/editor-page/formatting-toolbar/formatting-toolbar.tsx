import {
  Bold,
  Heading1,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  SquareCode,
  Strikethrough,
  Table2,
} from "lucide-react";
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
  const actionClassName =
    "formatting-toolbar__action size-8 min-h-0 min-w-0 rounded-app-sm border-transparent bg-transparent p-0 text-app-text shadow-none backdrop-blur-none hover:border-transparent hover:bg-[color:var(--glass-hover)]";
  const separatorClassName = "mx-0.5 h-4 w-px shrink-0 rounded-full bg-[color:var(--glass-border-strong)]";

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="formatting-toolbar inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] p-0.5 backdrop-blur-[var(--glass-blur-soft)] shadow-[var(--shadow-crisp)]"
    >
      <ToolbarGroup>
        <IconButton label="Heading" onClick={onHeading} disabled={disabled} className={actionClassName}>
          <Heading1 size={16} aria-hidden="true" />
        </IconButton>
      </ToolbarGroup>
      <span aria-hidden="true" className={separatorClassName} />
      <ToolbarGroup>
        <IconButton label="Bold" onClick={onBold} disabled={disabled} className={actionClassName}>
          <Bold size={16} aria-hidden="true" />
        </IconButton>
        <IconButton label="Italic" onClick={onItalic} disabled={disabled} className={actionClassName}>
          <Italic size={16} aria-hidden="true" />
        </IconButton>
        <IconButton
          label="Strikethrough"
          onClick={onStrike}
          disabled={disabled}
          className={actionClassName}
        >
          <Strikethrough size={16} aria-hidden="true" />
        </IconButton>
      </ToolbarGroup>
      <span aria-hidden="true" className={separatorClassName} />
      <ToolbarGroup>
        <IconButton
          label="Bullet list"
          onClick={onBulletList}
          disabled={disabled}
          className={actionClassName}
        >
          <List size={16} aria-hidden="true" />
        </IconButton>
        <IconButton
          label="Numbered list"
          onClick={onOrderedList}
          disabled={disabled}
          className={actionClassName}
        >
          <ListOrdered size={16} aria-hidden="true" />
        </IconButton>
        <IconButton label="Task list" onClick={onTaskList} disabled={disabled} className={actionClassName}>
          <ListTodo size={16} aria-hidden="true" />
        </IconButton>
      </ToolbarGroup>
      <span aria-hidden="true" className={separatorClassName} />
      <ToolbarGroup>
        <IconButton label="Quote" onClick={onQuote} disabled={disabled} className={actionClassName}>
          <Quote size={16} aria-hidden="true" />
        </IconButton>
        <IconButton label="Code block" onClick={onCodeBlock} disabled={disabled} className={actionClassName}>
          <SquareCode size={16} aria-hidden="true" />
        </IconButton>
        <IconButton label="Link" onClick={onLink} disabled={disabled} className={actionClassName}>
          <Link2 size={16} aria-hidden="true" />
        </IconButton>
        <IconButton label="Table" onClick={onTable} disabled={disabled} className={actionClassName}>
          <Table2 size={16} aria-hidden="true" />
        </IconButton>
        <IconButton label="Image" onClick={onImage} disabled={disabled} className={actionClassName}>
          <ImageIcon size={16} aria-hidden="true" />
        </IconButton>
      </ToolbarGroup>
    </div>
  );
}
