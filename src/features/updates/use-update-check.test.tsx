import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../settings/settings-schema";
import { useSettingsStore } from "../settings/settings-store";
import { useUpdateStore } from "./update-store";
import { useUpdateCheckOnLaunch } from "./use-update-check";

const { detectPlatformMock } = vi.hoisted(() => ({ detectPlatformMock: vi.fn() }));

vi.mock("../../platform/runtime", () => ({ detectPlatform: detectPlatformMock }));

const checkMock = vi.fn(async () => {});

function hydrate(checkAutomatically: boolean) {
  const settings = createDefaultSettings();
  settings.updates.checkAutomatically = checkAutomatically;
  act(() => useSettingsStore.getState().hydrate(settings));
}

describe("useUpdateCheckOnLaunch", () => {
  beforeEach(() => {
    detectPlatformMock.mockReset().mockReturnValue("desktop");
    checkMock.mockClear();
    useUpdateStore.setState({ check: checkMock });
    useSettingsStore.getState().reset();
  });

  it("runs one silent check on desktop once settings with the setting on have loaded", () => {
    renderHook(() => useUpdateCheckOnLaunch());
    hydrate(true);

    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(checkMock).toHaveBeenCalledWith({ silent: true });
  });

  it("does not check before settings have hydrated, even though the defaults say yes", () => {
    renderHook(() => useUpdateCheckOnLaunch());

    expect(useSettingsStore.getState().settings.updates.checkAutomatically).toBe(true);
    expect(checkMock).not.toHaveBeenCalled();
  });

  it("does not check when the setting is off", () => {
    renderHook(() => useUpdateCheckOnLaunch());
    hydrate(false);

    expect(checkMock).not.toHaveBeenCalled();
  });

  it("does not check when the setting is turned on later in the same run", () => {
    renderHook(() => useUpdateCheckOnLaunch());
    hydrate(false);
    const next = createDefaultSettings();
    act(() => useSettingsStore.getState().hydrate(next));

    expect(checkMock).not.toHaveBeenCalled();
  });

  it("does not check on web", () => {
    detectPlatformMock.mockReturnValue("web");
    renderHook(() => useUpdateCheckOnLaunch());
    hydrate(true);

    expect(checkMock).not.toHaveBeenCalled();
  });

  it("does not check again on re-render or when settings change", () => {
    const { rerender } = renderHook(() => useUpdateCheckOnLaunch());
    hydrate(true);
    rerender();
    act(() => useSettingsStore.getState().updateEditor({ lineNumbers: true }));
    hydrate(true);

    expect(checkMock).toHaveBeenCalledTimes(1);
  });
});
