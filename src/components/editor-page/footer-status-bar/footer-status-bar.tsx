import { Badge } from "@/components/ui/badge";
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
      className="flex h-8 items-center justify-between border-t bg-card/70 px-3 text-xs text-muted-foreground backdrop-blur-md"
      aria-label="Footer status bar"
    >
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="capitalize">
          {viewMode}
        </Badge>
        <span>Markdown</span>
        <span className="font-mono tabular-nums">{`Ln ${line}, Col ${column}`}</span>
      </div>
      <span className="font-mono tabular-nums">
        {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
      </span>
    </footer>
  );
}
