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
  type LucideIcon,
} from "lucide-react";
import { Fragment } from "react";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "@/components/ui/toolbar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

interface ToolbarAction {
  label: string;
  icon: LucideIcon;
  run: () => void;
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
  // Grouped by what they do to the text: structure, emphasis, lists, then blocks and media.
  const groups: ToolbarAction[][] = [
    [{ label: "Heading", icon: Heading1, run: onHeading }],
    [
      { label: "Bold", icon: Bold, run: onBold },
      { label: "Italic", icon: Italic, run: onItalic },
      { label: "Strikethrough", icon: Strikethrough, run: onStrike },
    ],
    [
      { label: "Bullet list", icon: List, run: onBulletList },
      { label: "Numbered list", icon: ListOrdered, run: onOrderedList },
      { label: "Task list", icon: ListTodo, run: onTaskList },
    ],
    [
      { label: "Quote", icon: Quote, run: onQuote },
      { label: "Code block", icon: SquareCode, run: onCodeBlock },
      { label: "Link", icon: Link2, run: onLink },
      { label: "Table", icon: Table2, run: onTable },
      { label: "Image", icon: ImageIcon, run: onImage },
    ],
  ];

  return (
    <Toolbar aria-label="Formatting" className="formatting-toolbar">
      {groups.map((group, index) => (
        <Fragment key={group[0].label}>
          {index > 0 ? <ToolbarSeparator /> : null}
          {group.map(({ label, icon: Icon, run }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <ToolbarButton aria-label={label} disabled={disabled} onClick={run}>
                  <Icon aria-hidden="true" />
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </Fragment>
      ))}
    </Toolbar>
  );
}
