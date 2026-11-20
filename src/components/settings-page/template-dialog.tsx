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
import { Field, FieldLabel } from "@/components/ui/field";
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
        <Field>
          <FieldLabel htmlFor="template-content">Template content</FieldLabel>
          <Textarea
            id="template-content"
            className="min-h-64 font-mono"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </Field>
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
