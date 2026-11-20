import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { defaultNewDocumentTemplate } from "../../features/settings/settings-schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TemplateDialogProps {
  /** The saved template. The draft starts from this each time the dialog opens. */
  template: string;
  onSave: (value: string) => void;
}

/** Edits the new-document template in a dialog: Save persists, Reset only changes the draft, Esc discards it. */
export function TemplateDialog({ template, onSave }: TemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(template);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(template);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Edit template…</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New document template</DialogTitle>
          <DialogDescription>This content is used only for newly created documents.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="template-content">Template content</Label>
          <Textarea
            id="template-content"
            className="min-h-64 font-mono"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDraft(defaultNewDocumentTemplate)}>
            <RotateCcw aria-hidden="true" />
            Reset template
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(draft);
              setOpen(false);
            }}
          >
            <Save aria-hidden="true" />
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
