import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { AUTOSAVE_DELAY_MS, useAutosave } from "./use-autosave";
import { useDocumentStore } from "../../store/document";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { useSettingsStore } from "../../features/settings/settings-store";

function seedDocument(isDirty: boolean) {
  const document = { id: "doc-1", content: "# A", filePath: "/notes/a.md", isDirty };
  useDocumentStore.setState({
    projects: [{ id: "project-1", name: "P", documents: [document], activeDocumentId: "doc-1" }],
    activeProjectId: "project-1",
    openDocuments: [document],
    activeDocumentId: "doc-1",
    content: "# A",
    filePath: "/notes/a.md",
    isDirty,
    recentDocuments: [],
  });
}

function setAutosave(autosave: boolean) {
  const settings = createDefaultSettings();
  settings.files.autosave = autosave;
  useSettingsStore.setState({ isHydrated: true, settings });
}

function edit(content: string) {
  act(() => useDocumentStore.getState().setContent(content));
}

describe("useAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    seedDocument(true);
    setAutosave(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves once the typing pauses", () => {
    const save = vi.fn();
    renderHook(() => useAutosave({ save, canSaveInPlace: () => true }));

    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);
    expect(save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("restarts the countdown on every edit, so a burst of typing saves once", () => {
    const save = vi.fn();
    renderHook(() => useAutosave({ save, canSaveInPlace: () => true }));

    vi.advanceTimersByTime(1000);
    edit("# AB");
    vi.advanceTimersByTime(1000);
    edit("# ABC");
    vi.advanceTimersByTime(1000);
    expect(save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the setting is off", () => {
    setAutosave(false);
    const save = vi.fn();
    renderHook(() => useAutosave({ save, canSaveInPlace: () => true }));

    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 3);

    expect(save).not.toHaveBeenCalled();
  });

  it("does nothing when there is nothing unsaved", () => {
    seedDocument(false);
    const save = vi.fn();
    renderHook(() => useAutosave({ save, canSaveInPlace: () => true }));

    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 3);

    expect(save).not.toHaveBeenCalled();
  });

  it("skips documents that can't be saved without a dialog or download", () => {
    const save = vi.fn();
    renderHook(() => useAutosave({ save, canSaveInPlace: () => false }));

    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 3);

    expect(save).not.toHaveBeenCalled();
  });

  it("cancels the pending save when the setting is switched off", () => {
    const save = vi.fn();
    renderHook(() => useAutosave({ save, canSaveInPlace: () => true }));

    vi.advanceTimersByTime(1000);
    act(() => useSettingsStore.getState().updateFiles({ autosave: false }));
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);

    expect(save).not.toHaveBeenCalled();
  });

  it("cancels the pending save when unmounted", () => {
    const save = vi.fn();
    const { unmount } = renderHook(() => useAutosave({ save, canSaveInPlace: () => true }));

    unmount();
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);

    expect(save).not.toHaveBeenCalled();
  });

  it("checks whether it can save at the moment it fires, not when it was scheduled", () => {
    const save = vi.fn();
    let savable = true;
    renderHook(() => useAutosave({ save, canSaveInPlace: () => savable }));

    savable = false;
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);

    expect(save).not.toHaveBeenCalled();
  });
});
