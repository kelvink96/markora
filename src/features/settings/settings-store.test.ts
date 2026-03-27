import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultSettings } from "./settings-schema";
import { useSettingsStore } from "./settings-store";

describe("settings-store", () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it("hydrates from loaded settings", () => {
    const loaded = createDefaultSettings();
    loaded.appearance.theme = "dark";
    loaded.authoring.newDocumentTemplate = "# Loaded";

    useSettingsStore.getState().hydrate(loaded);

    expect(useSettingsStore.getState().settings.appearance.theme).toBe("dark");
    expect(useSettingsStore.getState().templateDraft).toBe("# Loaded");
    expect(useSettingsStore.getState().isHydrated).toBe(true);
  });

  it("updates nested settings fields", () => {
    useSettingsStore.getState().updateAppearance({ theme: "light", showStatusBar: false });

    expect(useSettingsStore.getState().settings.appearance.theme).toBe("light");
    expect(useSettingsStore.getState().settings.appearance.showStatusBar).toBe(false);
  });

  it("updates editor settings fields", () => {
    useSettingsStore.getState().updateEditor({ lineNumbers: false });

    expect(useSettingsStore.getState().settings.editor.lineNumbers).toBe(false);
  });

  it("updates preview settings fields", () => {
    useSettingsStore.getState().updatePreview({ contentWidth: "wide" });

    expect(useSettingsStore.getState().settings.preview.contentWidth).toBe("wide");
  });

  it("resets back to defaults", () => {
    useSettingsStore.getState().updateFiles({ autosave: true });
    useSettingsStore.getState().setTemplateDraft("# Changed");
    useSettingsStore.getState().saveTemplateDraft();

    useSettingsStore.getState().reset();

    expect(useSettingsStore.getState().settings).toEqual(createDefaultSettings());
    expect(useSettingsStore.getState().templateDraft).toBe(
      createDefaultSettings().authoring.newDocumentTemplate,
    );
  });

  it("keeps the template draft separate until saved", () => {
    const original = useSettingsStore.getState().settings.authoring.newDocumentTemplate;

    useSettingsStore.getState().setTemplateDraft("# Draft");

    expect(useSettingsStore.getState().templateDraft).toBe("# Draft");
    expect(useSettingsStore.getState().settings.authoring.newDocumentTemplate).toBe(original);

    useSettingsStore.getState().saveTemplateDraft();

    expect(useSettingsStore.getState().settings.authoring.newDocumentTemplate).toBe("# Draft");
  });
});
