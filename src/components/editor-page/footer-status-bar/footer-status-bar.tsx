import { WordCount } from "../../shared/word-count";

interface FooterStatusBarProps {
  wordCount: number;
}

export function FooterStatusBar({ wordCount }: FooterStatusBarProps) {
  return (
    <footer
      className="flex items-center justify-between border-t border-[color:var(--ghost-border)] bg-app-panel/88 px-3 py-1.5 text-app-text-secondary backdrop-blur-md"
      aria-label="Footer status bar"
    >
      <div className="flex items-center gap-2">
        <span className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-app-text-muted">
          Status
        </span>
      </div>
      <WordCount value={wordCount} />
    </footer>
  );
}
