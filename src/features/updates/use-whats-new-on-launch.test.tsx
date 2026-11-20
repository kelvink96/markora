import { renderHook, act } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingWhatsNew } from "../../platform/updates";
import { useWhatsNewOnLaunch } from "./use-whats-new-on-launch";

const { toastMock, adapter, store } = vi.hoisted(() => {
  const store: { record: PendingWhatsNew | null } = { record: null };
  return {
    toastMock: vi.fn(),
    store,
    adapter: {
      getCurrentVersion: vi.fn(),
      loadPendingWhatsNew: vi.fn(async () => store.record),
      clearPendingWhatsNew: vi.fn(async () => {
        store.record = null;
      }),
    },
  };
});

vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("../../platform/updates", () => ({ getUpdateAdapter: () => adapter }));

const record: PendingWhatsNew = { version: "1.6.0", notes: "## What's Changed", publishedAt: null };

async function render(deferred = false) {
  const hook = renderHook(({ deferred: d }) => useWhatsNewOnLaunch({ deferred: d }), {
    initialProps: { deferred },
  });
  // The record and the running version are read asynchronously.
  await act(async () => {});
  return hook;
}

describe("useWhatsNewOnLaunch", () => {
  beforeEach(() => {
    store.record = null;
    toastMock.mockReset();
    adapter.getCurrentVersion.mockReset().mockResolvedValue("1.6.0");
    adapter.loadPendingWhatsNew.mockClear();
    adapter.clearPendingWhatsNew.mockClear();
  });

  it("shows one sticky toast when the saved version matches the running version, and clears the record", async () => {
    store.record = record;

    await render();

    expect(toastMock).toHaveBeenCalledTimes(1);
    const [title, options] = toastMock.mock.calls[0];
    expect(title).toBe("Updated to 1.6.0");
    expect(options).toMatchObject({
      description: "Markora is up to date.",
      duration: Infinity,
      action: { label: "What's new" },
    });
    expect(adapter.clearPendingWhatsNew).toHaveBeenCalledTimes(1);
  });

  it("matches the versions ignoring a leading v", async () => {
    store.record = { ...record, version: "v1.6.0" };

    await render();

    expect(toastMock).toHaveBeenCalledTimes(1);
  });

  it("omits the action when the notes are blank", async () => {
    store.record = { ...record, notes: "  " };

    await render();

    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock.mock.calls[0][1].action).toBeUndefined();
  });

  it("opens the dialog from the toast action, and closeDialog closes it", async () => {
    store.record = record;
    const { result } = await render();

    expect(result.current.dialogRecord).toBeNull();
    act(() => toastMock.mock.calls[0][1].action.onClick());
    expect(result.current.dialogRecord).toEqual(record);

    act(() => result.current.closeDialog());
    expect(result.current.dialogRecord).toBeNull();
  });

  it("clears a stale record for another version without a toast", async () => {
    store.record = { ...record, version: "1.5.0" };

    await render();

    expect(toastMock).not.toHaveBeenCalled();
    expect(adapter.clearPendingWhatsNew).toHaveBeenCalledTimes(1);
  });

  it("does nothing when there is no record", async () => {
    await render();

    expect(toastMock).not.toHaveBeenCalled();
    expect(adapter.clearPendingWhatsNew).not.toHaveBeenCalled();
  });

  it("keeps the record and shows nothing when the running version is unknown", async () => {
    adapter.getCurrentVersion.mockResolvedValue(null);
    store.record = record;

    await render();

    expect(toastMock).not.toHaveBeenCalled();
    expect(adapter.clearPendingWhatsNew).not.toHaveBeenCalled();
  });

  it("still shows the toast when clearing the record fails", async () => {
    store.record = record;
    adapter.clearPendingWhatsNew.mockRejectedValueOnce(new Error("cannot delete"));

    await render();

    expect(toastMock).toHaveBeenCalledTimes(1);
  });

  it("waits while deferred, then shows once", async () => {
    store.record = record;
    const { rerender } = await render(true);

    expect(toastMock).not.toHaveBeenCalled();
    expect(adapter.clearPendingWhatsNew).not.toHaveBeenCalled();

    rerender({ deferred: false });
    await act(async () => {});

    expect(toastMock).toHaveBeenCalledTimes(1);
  });

  it("is not lost when it becomes deferred while the version is still being read", async () => {
    store.record = record;
    let resolveVersion!: (version: string) => void;
    adapter.getCurrentVersion.mockReturnValue(new Promise((resolve) => (resolveVersion = resolve)));
    const { rerender } = await render(false);

    rerender({ deferred: true });
    await act(async () => resolveVersion("1.6.0"));
    expect(toastMock).not.toHaveBeenCalled();

    adapter.getCurrentVersion.mockResolvedValue("1.6.0");
    rerender({ deferred: false });
    await act(async () => {});

    expect(toastMock).toHaveBeenCalledTimes(1);
  });

  it("shows only one toast under StrictMode", async () => {
    store.record = record;
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

    renderHook(() => useWhatsNewOnLaunch({ deferred: false }), { wrapper });
    await act(async () => {});

    expect(toastMock).toHaveBeenCalledTimes(1);
  });
});
