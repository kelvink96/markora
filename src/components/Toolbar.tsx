interface ToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onToggleTheme: () => void;
  theme: "light" | "dark";
  isDirty: boolean;
  filePath: string | null;
}

export function Toolbar({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onToggleTheme,
  theme,
  isDirty,
  filePath,
}: ToolbarProps) {
  // Normalize Windows backslashes so splitting on "/" works for both platforms.
  const fileName = filePath
    ? filePath.replace(/\\/g, "/").split("/").pop()
    : "Untitled";

  return (
    <div className="toolbar">
      <div className="toolbar-actions">
        <button onClick={onNew}>New</button>
        <button onClick={onOpen}>Open</button>
        <button onClick={onSave}>Save</button>
        <button onClick={onSaveAs}>Save As</button>
      </div>
      <div className="toolbar-title">
        {fileName}
        {isDirty ? " •" : ""}
      </div>
      <div className="toolbar-right">
        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
    </div>
  );
}
