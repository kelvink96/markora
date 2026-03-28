import type { MarkoraSettings } from "../../features/settings/settings-schema";
import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS_SECTION } from "./settings-navigation";
import { getSystemThemeMode } from "./settings-page-shared";
import type { SettingsSection } from "./settings-page-types";

interface UseSettingsPageStateOptions {
  settings: MarkoraSettings;
  templateDraft: string;
}

export function useSettingsPageState({
  settings,
  templateDraft,
}: UseSettingsPageStateOptions) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(DEFAULT_SETTINGS_SECTION);
  const [appearanceDraft, setAppearanceDraft] = useState(settings.appearance);
  const [editorDraft, setEditorDraft] = useState(settings.editor);
  const [filesDraft, setFilesDraft] = useState(settings.files);
  const [templateDraftValue, setTemplateDraftValue] = useState(templateDraft);
  const [systemThemeMode, setSystemThemeMode] = useState<"light" | "dark">(getSystemThemeMode);

  useEffect(() => {
    setAppearanceDraft(settings.appearance);
    setEditorDraft(settings.editor);
    setFilesDraft(settings.files);
  }, [settings]);

  useEffect(() => {
    setTemplateDraftValue(templateDraft);
  }, [templateDraft]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return;

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemThemeMode(event.matches ? "dark" : "light");
    };

    setSystemThemeMode(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const previewThemeMode = appearanceDraft.theme === "system" ? systemThemeMode : appearanceDraft.theme;

  return {
    activeSection,
    appearanceDraft,
    editorDraft,
    filesDraft,
    previewThemeMode,
    setActiveSection,
    setAppearanceDraft,
    setEditorDraft,
    setFilesDraft,
    setTemplateDraftValue,
    templateDraftValue,
  };
}
