import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ExternalLink } from "../external-link";

interface SettingsFooterProps {
  version: string;
  privacyPolicyUrl: string;
  onResetAll: () => void;
}

/** About details and the destructive reset, kept out of the way at the bottom of the page. */
export function SettingsFooter({ version, privacyPolicyUrl, onResetAll }: SettingsFooterProps) {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm text-muted-foreground">
      <div className="space-y-1">
        <p>Markora, a desktop-first markdown editor.</p>
        <p>{`Version ${version}`}</p>
        <ExternalLink href={privacyPolicyUrl}>Privacy policy</ExternalLink>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <TriangleAlert data-testid="settings-danger-icon" aria-hidden="true" />
            Reset all settings
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
            <AlertDialogDescription>
              Every preference and the new-document template go back to their defaults. Your documents are not
              touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={onResetAll}>
              Reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </footer>
  );
}
