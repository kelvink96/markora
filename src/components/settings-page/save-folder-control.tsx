import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface SaveFolderControlProps {
  /** The chosen folder; empty means the system default. */
  folder: string;
  onChange: (folder: string) => void;
  /** Opens the native folder picker. Resolves to null when cancelled. */
  onPickFolder: () => Promise<string | null>;
  /** Checks whether the chosen folder is still there, so a deleted one can be called out. */
  folderExists?: (path: string) => Promise<boolean>;
}

/** The default save folder: the chosen path (or "System default") and a button to pick another. */
export function SaveFolderControl({ folder, onChange, onPickFolder, folderExists }: SaveFolderControlProps) {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setMissing(false);
    if (!folder || !folderExists) return;
    let current = true;
    folderExists(folder)
      .then((exists) => current && setMissing(!exists))
      .catch(() => current && setMissing(false));
    return () => {
      current = false;
    };
  }, [folder, folderExists]);

  const pick = async () => {
    const picked = await onPickFolder();
    if (picked) onChange(picked);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {folder ? (
          <span className="max-w-64 truncate rounded-md border bg-card px-2.5 py-1.5 font-mono text-xs" title={folder}>
            {folder}
          </span>
        ) : (
          <span className="text-muted-foreground italic">System default</span>
        )}
        <Button type="button" variant="outline" onClick={() => void pick()}>
          {folder ? "Change…" : "Choose…"}
        </Button>
      </div>
      {missing ? (
        <p role="status" className="max-w-72 text-right text-xs text-destructive">
          This folder no longer exists. Save As will use the system default until you pick another.
        </p>
      ) : null}
    </div>
  );
}
