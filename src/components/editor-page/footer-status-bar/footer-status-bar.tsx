import { WordCount } from "../../shared/word-count";
import { Text } from "../../shared/text";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";

interface FooterStatusBarProps {
  wordCount: number;
  viewMode: WorkspaceViewMode;
  line: number;
  column: number;
}

export function FooterStatusBar({ wordCount, viewMode, line, column }: FooterStatusBarProps) {
  return (
    <footer
      className="flex items-center justify-between border-t border-[color:var(--ghost-border)] bg-app-panel/88 px-3 py-1.5 text-app-text-secondary backdrop-blur-md"
      aria-label="Footer status bar"
    >
      <div className="flex items-center gap-3">
        <Text as="span" weight="medium" className="capitalize text-app-text">
          {viewMode}
        </Text>
        <Text as="span" tone="subtle">
          Markdown
        </Text>
        <Text as="span" tone="subtle">
          {`Ln ${line}, Col ${column}`}
        </Text>
      </div>
      <WordCount value={wordCount} />
    </footer>
  );
}
