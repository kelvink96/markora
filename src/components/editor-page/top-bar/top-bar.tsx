import { useThemeStore } from "../../../features/theme/theme-store";
import { getDisplayFileName } from "../../../features/document/document-actions";
import { DocumentStatus } from "../document-status";
import { FileMenu } from "../../shared/file-menu";
import { LivePreviewIndicator } from "../../shared/live-preview-indicator";
import { ThemeToggle } from "../../shared/theme-toggle";
import { WordCount } from "../../shared/word-count";
import "./top-bar.css";

interface TopBarProps {
  fileName: string;
  isDirty: boolean;
  wordCount: number;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}

export function TopBar({
  fileName,
  isDirty,
  wordCount,
  theme,
  onThemeToggle,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
}: TopBarProps) {
  const currentTheme = useThemeStore((state) => state.theme);
  const effectiveTheme = currentTheme === "light" || currentTheme === "dark" ? currentTheme : theme;

  return (
    <header className="top-bar">
      <div className="top-bar__document" data-testid="top-bar-document">
        <DocumentStatus fileName={getDisplayFileName(fileName)} isDirty={isDirty} />
      </div>
      <div className="top-bar__utilities" data-testid="top-bar-utilities">
        <WordCount value={wordCount} />
        <LivePreviewIndicator />
        <ThemeToggle
          checked={effectiveTheme === "dark"}
          onCheckedChange={onThemeToggle}
        />
        <FileMenu onNew={onNew} onOpen={onOpen} onSave={onSave} onSaveAs={onSaveAs} />
      </div>
    </header>
  );
}
