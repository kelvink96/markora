import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TourPromptProps {
  open: boolean;
  /** Skip, Escape and outside clicks all count as skipping: the prompt is one-time. */
  onSkip: () => void;
  onStart: () => void;
}

/** The one-time "Take a quick tour?" invitation shown to unseen users. */
export function TourPrompt({ open, onSkip, onStart }: TourPromptProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onSkip()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take a quick tour?</DialogTitle>
          <DialogDescription>
            A minute-long walkthrough of the main areas of Markora. You can skip it and still find
            everything yourself.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
          <Button onClick={onStart}>Start tour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
