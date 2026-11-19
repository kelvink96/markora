import { create } from "zustand";
import {
  createDefaultSettings,
  type AppearanceSettings,
  type EditorSettings,
  type FileSettings,
  type MarkoraSettings,
  type OnboardingSettings,
  type PreviewSettings,
  type UpdateSettings,
} from "./settings-schema";

interface SettingsStore {
  isHydrated: boolean;
  settings: MarkoraSettings;
  templateDraft: string;
  hydrate: (settings: MarkoraSettings) => void;
  updateAppearance: (appearance: Partial<AppearanceSettings>) => void;
  updateEditor: (editor: Partial<EditorSettings>) => void;
  updatePreview: (preview: Partial<PreviewSettings>) => void;
  updateFiles: (files: Partial<FileSettings>) => void;
  updateOnboarding: (onboarding: Partial<OnboardingSettings>) => void;
  updateUpdates: (updates: Partial<UpdateSettings>) => void;
  setTemplateDraft: (templateDraft: string) => void;
  saveTemplateDraft: () => void;
  reset: () => void;
}

function createInitialState() {
  const settings = createDefaultSettings();

  return {
    isHydrated: false,
    settings,
    templateDraft: settings.authoring.newDocumentTemplate,
  };
}

export const useSettingsStore = create<SettingsStore>()((set) => ({
  ...createInitialState(),
  hydrate: (settings) =>
    set({
      isHydrated: true,
      settings: structuredClone(settings),
      templateDraft: settings.authoring.newDocumentTemplate,
    }),
  updateAppearance: (appearance) =>
    set((state) => ({
      settings: {
        ...state.settings,
        appearance: {
          ...state.settings.appearance,
          ...appearance,
        },
      },
    })),
  updateEditor: (editor) =>
    set((state) => ({
      settings: {
        ...state.settings,
        editor: {
          ...state.settings.editor,
          ...editor,
        },
      },
    })),
  updatePreview: (preview) =>
    set((state) => ({
      settings: {
        ...state.settings,
        preview: {
          ...state.settings.preview,
          ...preview,
        },
      },
    })),
  updateFiles: (files) =>
    set((state) => ({
      settings: {
        ...state.settings,
        files: {
          ...state.settings.files,
          ...files,
        },
      },
    })),
  updateOnboarding: (onboarding) =>
    set((state) => ({
      settings: {
        ...state.settings,
        onboarding: {
          ...state.settings.onboarding,
          ...onboarding,
        },
      },
    })),
  updateUpdates: (updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        updates: {
          ...state.settings.updates,
          ...updates,
        },
      },
    })),
  setTemplateDraft: (templateDraft) => set({ templateDraft }),
  saveTemplateDraft: () =>
    set((state) => ({
      settings: {
        ...state.settings,
        authoring: {
          ...state.settings.authoring,
          newDocumentTemplate: state.templateDraft,
        },
      },
    })),
  reset: () => set(createInitialState()),
}));
