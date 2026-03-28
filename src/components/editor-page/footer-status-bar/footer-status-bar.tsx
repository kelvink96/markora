import { WordCount } from "../../shared/word-count";
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
        <span className="text-sm font-medium capitalize text-app-text-secondary">{viewMode}</span>
        <span className="text-sm text-app-text-muted">Markdown</span>
        <span className="text-sm text-app-text-muted">{`Ln ${line}, Col ${column}`}</span>
      </div>
      <WordCount value={wordCount} />
    </footer>
  );
}
