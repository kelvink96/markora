import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { useSettingsPageState } from "./use-settings-page-state";

describe("useSettingsPageState", () => {
  it("syncs drafts from props and tracks system theme changes", () => {
    const settings = createDefaultSettings();
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    let matches = false;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn((): MediaQueryList => ({
        matches,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: (
          _type: string,
          listener: EventListenerOrEventListenerObject,
        ) => {
          listeners.add(listener as (event: MediaQueryListEvent) => void);
        },
        removeEventListener: (
          _type: string,
          listener: EventListenerOrEventListenerObject,
        ) => {
          listeners.delete(listener as (event: MediaQueryListEvent) => void);
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result, rerender } = renderHook(
      ({ nextSettings, nextTemplateDraft }) =>
        useSettingsPageState({
          settings: nextSettings,
          templateDraft: nextTemplateDraft,
        }),
      {
        initialProps: {
          nextSettings: settings,
          nextTemplateDraft: settings.authoring.newDocumentTemplate,
        },
      },
    );

    act(() => {
      result.current.setAppearanceDraft({
        ...result.current.appearanceDraft,
        theme: "dark",
      });
      result.current.setTemplateDraftValue("# custom");
    });

    const nextSettings = {
      ...settings,
      editor: {
        ...settings.editor,
        lineNumbers: !settings.editor.lineNumbers,
      },
    };

    rerender({
      nextSettings,
      nextTemplateDraft: "# from props",
    });

    expect(result.current.appearanceDraft.theme).toBe(nextSettings.appearance.theme);
    expect(result.current.editorDraft.lineNumbers).toBe(nextSettings.editor.lineNumbers);
    expect(result.current.templateDraftValue).toBe("# from props");
    expect(result.current.previewThemeMode).toBe("light");

    matches = true;
    act(() => {
      listeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent),
      );
    });

    act(() => {
      result.current.setAppearanceDraft({
        ...result.current.appearanceDraft,
        theme: "system",
      });
    });

    expect(result.current.previewThemeMode).toBe("dark");
  });
});
