import { useState } from "react";
import { ChevronRight, CircleAlert } from "lucide-react";
import { useSettingsStore } from "../../features/settings/settings-store";
import { SAVE_BEFORE_RESTART, useUpdateStore } from "../../features/updates/update-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ReleaseNotes } from "./release-notes";

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
  const hasBody =
    (status === "available" && update !== null) || status === "downloading" || status === "ready" || Boolean(errorMessage);

  return (
    <Card id="settings-updates" role="region" aria-label="Updates" className="mt-10 gap-4 py-4 text-sm">
      <CardHeader className="px-4">
        <CardTitle role="heading" aria-level={3}>
          Updates
        </CardTitle>
        <CardDescription>{`Version ${version}`}</CardDescription>
        <CardAction className="flex items-center gap-3">
          {status === "idle" ? <Button onClick={() => void check()}>Check for updates</Button> : null}
          {status === "checking" ? (
            <Button disabled>
              <Spinner aria-hidden="true" data-icon="inline-start" />
              Checking…
            </Button>
          ) : null}
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
        </CardAction>
      </CardHeader>

      {hasBody ? (
        <CardContent className="flex flex-col gap-4 px-4">
          {status === "available" && update ? (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2">
                <span>{`New release ${update.version}`}</span>
                <Badge>New</Badge>
              </p>
              {update.notes.trim() ? (
                <Collapsible className="group/notes flex flex-col gap-2">
                  <CollapsibleTrigger className="flex w-fit items-center gap-1 text-muted-foreground hover:text-foreground">
                    <ChevronRight aria-hidden="true" className="size-4 transition-transform group-data-[state=open]/notes:rotate-90" />
                    What's new
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ReleaseNotes markdown={update.notes} />
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </div>
          ) : null}

          {status === "downloading" ? (
            <div className="flex flex-col gap-1">
              <p>{update ? `Downloading ${update.version}…` : "Downloading…"}</p>
              {/* With no known total the bar is indeterminate rather than stuck at zero. */}
              <Progress aria-label="Download progress" value={percent} />
            </div>
          ) : null}

          {status === "ready" ? (
            <div className="flex flex-col gap-1">
              <p>Update downloaded</p>
              <p className="text-muted-foreground">Markora will close and reopen. Windows may ask for permission.</p>
              {showSaveHint ? <p className="text-muted-foreground">{SAVE_BEFORE_RESTART}</p> : null}
            </div>
          ) : null}

          {errorMessage ? (
            <Alert variant="destructive">
              <CircleAlert aria-hidden="true" />
              <AlertTitle>Couldn't update</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      ) : null}

      <CardFooter className="border-t px-4 [.border-t]:pt-4">
        <Field orientation="horizontal" className="justify-between">
          <FieldLabel htmlFor="setting-updates-check-automatically">Check automatically</FieldLabel>
          <Switch
            id="setting-updates-check-automatically"
            checked={checkAutomatically}
            onCheckedChange={(checked) => {
              updateUpdates({ checkAutomatically: checked });
              onChangeUpdates?.();
            }}
          />
        </Field>
      </CardFooter>
    </Card>
  );
}
