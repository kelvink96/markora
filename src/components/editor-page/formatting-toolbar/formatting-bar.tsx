import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { FormattingToolbar } from "./formatting-toolbar";

/** The slim second header row: the formatting toolbar wired to the editor. Shown while a document is open. */
export function FormattingBar() {
  const runToolbarAction = useEditorCommandState((state) => state.runToolbarAction);

  return (
    <div className="flex h-10 items-center border-b bg-card/40 px-2" data-testid="formatting-bar">
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
      />
    </div>
  );
}
