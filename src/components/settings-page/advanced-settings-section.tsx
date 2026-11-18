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
import { SectionCard } from "./settings-page-shared";

interface AdvancedSettingsSectionProps {
  onResetAll: () => void;
}

export function AdvancedSettingsSection({ onResetAll }: AdvancedSettingsSectionProps) {
  return (
    <SectionCard
      title="Advanced"
      description="Use reset carefully. This restores both app preferences and authoring defaults."
    >
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
    </SectionCard>
  );
}
