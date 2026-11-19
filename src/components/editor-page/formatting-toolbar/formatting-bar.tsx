import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { FormattingToolbar } from "./formatting-toolbar";

interface FormattingBarProps {
  /** True while the editor is hidden (the Read view), so a click cannot change a document nobody can see. */
  disabled?: boolean;
}

/** The slim second header row: the formatting toolbar wired to the editor. Shown while a document is open. */
export function FormattingBar({ disabled = false }: FormattingBarProps) {
  const runToolbarAction = useEditorCommandState((state) => state.runToolbarAction);

  return (
    // Scrolls sideways on narrow screens so every button stays reachable.
    <div className="flex h-10 items-center overflow-x-auto border-b bg-card/40 px-2 [scrollbar-width:none]" data-testid="formatting-bar" data-tour="formatting-bar">
      <FormattingToolbar
        onHeading={() => runToolbarAction("heading")}
        onBold={() => runToolbarAction("bold")}
        onItalic={() => runToolbarAction("italic")}
        onStrike={() => runToolbarAction("strike")}
        onBulletList={() => runToolbarAction("bulletList")}
        onOrderedList={() => runToolbarAction("orderedList")}
        onTaskList={() => runToolbarAction("taskList")}
        onQuote={() => runToolbarAction("quote")}
        onCodeBlock={() => runToolbarAction("codeBlock")}
        onLink={() => runToolbarAction("link")}
        onTable={() => runToolbarAction("table")}
        onImage={() => runToolbarAction("image")}
        disabled={disabled}
      />
    </div>
  );
}
