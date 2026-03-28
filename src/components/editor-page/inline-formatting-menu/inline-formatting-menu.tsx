import { Bold, Heading1, Italic, Link2, List, Quote, SquareCode } from "lucide-react";
import type { MarkdownToolbarAction } from "../../../features/editor/markdown-toolbar-actions";
import { FloatingMenu } from "../../shared/floating-menu";
import { IconButton } from "../../shared/icon-button";
import { Toolbar } from "../../shared/toolbar";
import { ToolbarGroup } from "../../shared/toolbar-group";

interface InlineFormattingMenuProps {
  position: {
    top: number;
    left: number;
  };
  onSelect: (action: MarkdownToolbarAction) => void;
}

const actionClassName =
  "size-8 min-h-0 min-w-0 rounded-app-sm border-transparent bg-transparent p-0 text-app-text shadow-none backdrop-blur-none hover:border-transparent hover:bg-[color:var(--glass-hover)]";

export function InlineFormattingMenu({ position, onSelect }: InlineFormattingMenuProps) {
  return (
    <FloatingMenu position={position} className="px-1.5 py-1">
      <Toolbar ariaLabel="Inline formatting" className="gap-1 p-0">
        <ToolbarGroup>
          <IconButton
            label="Bold"
            className={actionClassName}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect("bold")}
          >
            <Bold size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            label="Italic"
            className={actionClassName}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect("italic")}
          >
            <Italic size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            label="Link"
            className={actionClassName}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect("link")}
          >
            <Link2 size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            label="Heading"
            className={actionClassName}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect("heading")}
          >
            <Heading1 size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            label="Bullet list"
            className={actionClassName}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect("bulletList")}
          >
            <List size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            label="Quote"
            className={actionClassName}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect("quote")}
          >
            <Quote size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            label="Code block"
            className={actionClassName}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect("codeBlock")}
          >
            <SquareCode size={16} aria-hidden="true" />
          </IconButton>
        </ToolbarGroup>
      </Toolbar>
    </FloatingMenu>
  );
}
