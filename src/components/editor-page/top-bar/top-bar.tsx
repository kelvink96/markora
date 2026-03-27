import { useThemeStore } from "../../../features/theme/theme-store";
import { getDisplayFileName } from "../../../features/document/document-actions";
import { DocumentStatus } from "../document-status";
import { LivePreviewIndicator } from "../../shared/live-preview-indicator";
import { MenuBar } from "../../shared/menu-bar";
import { ThemeToggle } from "../../shared/theme-toggle";

interface TopBarProps {
  fileName: string;
  isDirty: boolean;
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
  theme,
  onThemeToggle,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
}: TopBarProps) {
  const currentTheme = useThemeStore((state) => state.theme);
  const effectiveTheme = currentTheme === "light" || currentTheme === "dark" ? currentTheme : theme;
  const menuGroups = [
    {
      label: "File",
      items: [
        { label: "New", onSelect: onNew },
        { label: "Open", onSelect: onOpen },
        { label: "Save", onSelect: onSave },
        { label: "Save As", onSelect: onSaveAs },
      ],
    },
    {
      label: "Edit",
      items: [{ label: "Undo", disabled: true }, { label: "Redo", disabled: true }],
    },
    {
      label: "View",
      items: [{ label: "Theme", onSelect: onThemeToggle }, { label: "Live Preview", disabled: true }],
    },
    {
      label: "Help",
      items: [
        { label: "Keyboard Shortcuts", disabled: true },
        { label: "About Markora", disabled: true },
      ],
    },
  ];

  return (
    <header className="grid grid-cols-[minmax(0,1.25fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-[color:var(--ghost-border)] bg-app-panel/90 px-3 py-2.5 backdrop-blur-md">
      <div className="flex min-w-0 items-center justify-start gap-2" data-testid="top-bar-document">
        <DocumentStatus fileName={getDisplayFileName(fileName)} isDirty={isDirty} />
      </div>
      <div
        className="flex items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--ghost-border)] bg-app-panel-strong/78 px-1 py-0.5 shadow-[var(--shadow-crisp)]"
        data-testid="top-bar-menu"
      >
        <MenuBar groups={menuGroups} />
      </div>
      <div
        className="flex flex-wrap items-center justify-end gap-1.5 rounded-full border border-[color:var(--ghost-border)] bg-app-panel-strong/90 px-1.5 py-0.5 shadow-[var(--shadow-crisp)]"
        data-testid="top-bar-utilities"
      >
        <LivePreviewIndicator />
        <ThemeToggle
          checked={effectiveTheme === "dark"}
          onCheckedChange={onThemeToggle}
        />
      </div>
    </header>
  );
}
