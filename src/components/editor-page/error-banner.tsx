import { CircleAlert, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

/** A dismissible error that floats over the content, so showing it never shifts the layout. */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-50 flex justify-center px-4">
      <Alert variant="destructive" role="alert" className="pointer-events-auto flex w-full max-w-lg items-center gap-3 shadow-lg">
        <CircleAlert aria-hidden="true" className="shrink-0" />
        <AlertDescription className="flex-1 text-destructive">{message}</AlertDescription>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={onDismiss} className="shrink-0">
          <X aria-hidden="true" />
        </Button>
      </Alert>
    </div>
  );
}
