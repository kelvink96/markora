import { Bold, Heading1, Italic, Link2, List, Quote, SquareCode, type LucideIcon } from "lucide-react";
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar";
import type { MarkdownToolbarAction } from "../../../features/editor/markdown-toolbar-actions";
import { FloatingPanel } from "../floating-panel";

interface InlineFormattingMenuProps {
  position: {
    top: number;
    left: number;
  };
  onSelect: (action: MarkdownToolbarAction) => void;
}

const actions: Array<{ label: string; action: MarkdownToolbarAction; icon: LucideIcon }> = [
  { label: "Bold", action: "bold", icon: Bold },
  { label: "Italic", action: "italic", icon: Italic },
  { label: "Link", action: "link", icon: Link2 },
  { label: "Heading", action: "heading", icon: Heading1 },
  { label: "Bullet list", action: "bulletList", icon: List },
  { label: "Quote", action: "quote", icon: Quote },
  { label: "Code block", action: "codeBlock", icon: SquareCode },
];

export function InlineFormattingMenu({ position, onSelect }: InlineFormattingMenuProps) {
  return (
    <FloatingPanel position={position} className="p-1">
      <Toolbar aria-label="Inline formatting">
        {actions.map(({ label, action, icon: Icon }) => (
          <ToolbarButton
            key={action}
            aria-label={label}
            title={label}
            // Keep the text selection: pressing a button would otherwise move focus out of the editor.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(action)}
          >
            <Icon aria-hidden="true" />
          </ToolbarButton>
        ))}
      </Toolbar>
    </FloatingPanel>
  );
}
