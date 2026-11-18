import { useEffect } from "react";
import { useDocumentStore } from "../../store/document";
import { useSettingsStore } from "../../features/settings/settings-store";

/** How long typing must pause before an edited document is saved. */
export const AUTOSAVE_DELAY_MS = 1500;

interface AutosaveOptions {
  save: () => void | Promise<void>;
  /** Whether saving the active document needs no dialog or download. */
  canSaveInPlace: () => boolean;
}

/**
 * Saves the active document a moment after the last edit, when the "Save automatically"
 * setting is on. Documents that would need a save dialog (untitled) or a download (web
 * imports) are skipped, so autosave never interrupts typing.
 */
export function useAutosave({ save, canSaveInPlace }: AutosaveOptions) {
  const enabled = useSettingsStore((state) => state.settings.files.autosave);
  const content = useDocumentStore((state) => state.content);
  const isDirty = useDocumentStore((state) => state.isDirty);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);

  useEffect(() => {
    if (!enabled || !isDirty) return;

    // Content, document and setting changes all restart the countdown.
    const timer = setTimeout(() => {
      if (canSaveInPlace()) {
        void save();
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [activeDocumentId, canSaveInPlace, content, enabled, isDirty, save]);
}
