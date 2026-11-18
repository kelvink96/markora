import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { useSettingsPageState } from "./use-settings-page-state";

function stubMatchMedia(listeners: Set<(event: MediaQueryListEvent) => void>, matches: () => boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((): MediaQueryList => ({
      matches: matches(),
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.add(listener as (event: MediaQueryListEvent) => void);
      },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.delete(listener as (event: MediaQueryListEvent) => void);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("useSettingsPageState", () => {
  it("resyncs the template draft from props and follows the system theme", () => {
    const settings = createDefaultSettings();
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    let matches = false;
    stubMatchMedia(listeners, () => matches);

    const { result, rerender } = renderHook(
      ({ nextSettings, nextTemplateDraft }) =>
        useSettingsPageState({ settings: nextSettings, templateDraft: nextTemplateDraft }),
      { initialProps: { nextSettings: settings, nextTemplateDraft: settings.authoring.newDocumentTemplate } },
    );

    act(() => {
      result.current.setTemplateDraftValue("# custom");
    });
    expect(result.current.templateDraftValue).toBe("# custom");

    rerender({ nextSettings: settings, nextTemplateDraft: "# from props" });

    expect(result.current.templateDraftValue).toBe("# from props");
    expect(result.current.previewThemeMode).toBe("light");

    matches = true;
    act(() => {
      listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    });

    // The default theme is "system", so the swatches follow the OS.
    expect(result.current.previewThemeMode).toBe("dark");
  });

  it("uses the saved theme directly when it is not 'system'", () => {
    const settings = createDefaultSettings();
    settings.appearance.theme = "dark";
    stubMatchMedia(new Set(), () => false);

    const { result, rerender } = renderHook(
      ({ nextSettings }) => useSettingsPageState({ settings: nextSettings, templateDraft: "" }),
      { initialProps: { nextSettings: settings } },
    );
    expect(result.current.previewThemeMode).toBe("dark");

    // A change applied elsewhere (e.g. the toolbar toggle) is reflected without any local draft to sync.
    rerender({ nextSettings: { ...settings, appearance: { ...settings.appearance, theme: "light" } } });
    expect(result.current.previewThemeMode).toBe("light");
  });
});
