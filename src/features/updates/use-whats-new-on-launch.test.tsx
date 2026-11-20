import { renderHook, act } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { savePendingWhatsNew, loadPendingWhatsNew } from "./whats-new-storage";
import { useWhatsNewOnLaunch } from "./use-whats-new-on-launch";

const { toastMock, getCurrentVersionMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
  getCurrentVersionMock: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("../../platform/updates", () => ({
  getUpdateAdapter: () => ({ getCurrentVersion: getCurrentVersionMock }),
}));

const record = { version: "1.6.0", notes: "## What's Changed", publishedAt: null };

async function render(deferred = false) {
  const hook = renderHook(({ deferred: d }) => useWhatsNewOnLaunch({ deferred: d }), {
    initialProps: { deferred },
  });
  // The running version is read asynchronously.
  await act(async () => {});
  return hook;
}

describe("useWhatsNewOnLaunch", () => {
  beforeEach(() => {
    localStorage.clear();
    toastMock.mockReset();
    getCurrentVersionMock.mockReset().mockResolvedValue("1.6.0");
  });

  it("shows one sticky toast when the saved version matches the running version, and clears the record", async () => {
    savePendingWhatsNew(record);

    await render();

    expect(toastMock).toHaveBeenCalledTimes(1);
    const [title, options] = toastMock.mock.calls[0];
    expect(title).toBe("Updated to 1.6.0");
    expect(options).toMatchObject({
      description: "Markora is up to date.",
      duration: Infinity,
      action: { label: "What's new" },
    });
    expect(loadPendingWhatsNew()).toBeNull();
  });

  it("matches the versions ignoring a leading v", async () => {
    savePendingWhatsNew({ ...record, version: "v1.6.0" });

    await render();

    expect(toastMock).toHaveBeenCalledTimes(1);
  });

  it("omits the action when the notes are blank", async () => {
    savePendingWhatsNew({ ...record, notes: "  " });

    await render();

    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock.mock.calls[0][1].action).toBeUndefined();
  });

  it("opens the dialog from the toast action, and closeDialog closes it", async () => {
    savePendingWhatsNew(record);
    const { result } = await render();

    expect(result.current.dialogRecord).toBeNull();
    act(() => toastMock.mock.calls[0][1].action.onClick());
    expect(result.current.dialogRecord).toEqual(record);

    act(() => result.current.closeDialog());
    expect(result.current.dialogRecord).toBeNull();
  });

  it("clears a stale record for another version without a toast", async () => {
    savePendingWhatsNew({ ...record, version: "1.5.0" });

    await render();

    expect(toastMock).not.toHaveBeenCalled();
    expect(loadPendingWhatsNew()).toBeNull();
  });

  it("does nothing when there is no record", async () => {
    await render();

    expect(toastMock).not.toHaveBeenCalled();
  });

  it("keeps the record and shows nothing when the running version is unknown", async () => {
    getCurrentVersionMock.mockResolvedValue(null);
    savePendingWhatsNew(record);

    await render();

    expect(toastMock).not.toHaveBeenCalled();
    expect(loadPendingWhatsNew()).toEqual(record);
  });

  it("waits while deferred, then shows once", async () => {
    savePendingWhatsNew(record);
    const { rerender } = await render(true);

    expect(toastMock).not.toHaveBeenCalled();
    expect(loadPendingWhatsNew()).toEqual(record);

    rerender({ deferred: false });
    await act(async () => {});
    rerender({ deferred: false });
    await act(async () => {});

    expect(toastMock).toHaveBeenCalledTimes(1);
  });

  it("shows only one toast under StrictMode", async () => {
    savePendingWhatsNew(record);
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

    renderHook(() => useWhatsNewOnLaunch({ deferred: false }), { wrapper });
    await act(async () => {});

    expect(toastMock).toHaveBeenCalledTimes(1);
  });
});
