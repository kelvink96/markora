import { useState } from "react";
import { useSettingsStore } from "../../features/settings/settings-store";
import { SAVE_BEFORE_RESTART, useUpdateStore } from "../../features/updates/update-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface UpdatesCardProps {
  version: string;
  hasUnsavedChanges: boolean;
  /** Called after the automatic-check preference changes, so the caller can persist it. */
  onChangeUpdates?: () => void;
}

/** Desktop only: check for, download and apply a new version without leaving settings. */
export function UpdatesCard({ version, hasUnsavedChanges, onChangeUpdates }: UpdatesCardProps) {
  const status = useUpdateStore((state) => state.status);
  const update = useUpdateStore((state) => state.update);
  const progress = useUpdateStore((state) => state.progress);
  const storeError = useUpdateStore((state) => state.error);
  const check = useUpdateStore((state) => state.check);
  const download = useUpdateStore((state) => state.download);
  const restart = useUpdateStore((state) => state.restart);
  const checkAutomatically = useSettingsStore((state) => state.settings.updates.checkAutomatically);
  const updateUpdates = useSettingsStore((state) => state.updateUpdates);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);

  const handleRestart = async () => {
    if (restarting) return;
    setRestarting(true);
    setRestartError(null);
    try {
      await restart();
    } catch (error) {
      setRestartError(error instanceof Error ? error.message : String(error));
    } finally {
      setRestarting(false);
    }
  };

  const percent =
    progress && progress.total ? Math.min(100, Math.round((progress.downloaded / progress.total) * 100)) : null;
  const showSaveHint = status === "ready" && hasUnsavedChanges;
  // The store's own dirty-tab refusal repeats the save hint, which already tracks the live dirty state.
  const readyError = status === "ready" && storeError !== SAVE_BEFORE_RESTART ? storeError : null;
  const errorMessage = restartError ?? (status === "error" ? storeError : readyError);
  // A failed download leaves the found update in place, so retrying downloads instead of re-checking.
  const retry = update ? download : check;

  return (
    <section aria-label="Updates" className="mt-10 space-y-4 rounded-xl border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-medium">Updates</h3>
          <p className="text-muted-foreground">{`Version ${version}`}</p>
        </div>
        <div className="flex items-center gap-3">
          {status === "idle" ? <Button onClick={() => void check()}>Check for updates</Button> : null}
          {status === "checking" ? <Button disabled>Checking…</Button> : null}
          {status === "up-to-date" ? (
            <>
              <span className="text-muted-foreground">You're up to date</span>
              <Button variant="outline" onClick={() => void check()}>
                Check again
              </Button>
            </>
          ) : null}
          {status === "available" ? <Button onClick={() => void download()}>Download update</Button> : null}
          {status === "ready" ? (
            <Button disabled={hasUnsavedChanges || restarting} onClick={() => void handleRestart()}>
              Restart to install
            </Button>
          ) : null}
          {status === "error" ? <Button onClick={() => void retry()}>Try again</Button> : null}
        </div>
      </div>

      {status === "available" && update ? (
        <div className="space-y-1">
          <p>{`Version ${update.version} is available.`}</p>
          {update.notes ? <p className="whitespace-pre-wrap text-muted-foreground">{update.notes}</p> : null}
        </div>
      ) : null}

      {status === "downloading" ? (
        <div className="space-y-1">
          <p>{update ? `Downloading ${update.version}…` : "Downloading…"}</p>
          <div
            role="progressbar"
            aria-label="Download progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent ?? undefined}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full bg-primary transition-[width]" style={{ width: `${percent ?? 0}%` }} />
          </div>
        </div>
      ) : null}

      {status === "ready" ? (
        <div className="space-y-1">
          <p>Update downloaded</p>
          <p className="text-muted-foreground">Markora will close and reopen. Windows may ask for permission.</p>
          {showSaveHint ? <p className="text-muted-foreground">{SAVE_BEFORE_RESTART}</p> : null}
        </div>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <Label htmlFor="setting-updates-check-automatically">Check automatically</Label>
        <Switch
          id="setting-updates-check-automatically"
          checked={checkAutomatically}
          onCheckedChange={(checked) => {
            updateUpdates({ checkAutomatically: checked });
            onChangeUpdates?.();
          }}
        />
      </div>
    </section>
  );
}
