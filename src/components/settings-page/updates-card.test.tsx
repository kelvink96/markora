import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSettingsStore } from "../../features/settings/settings-store";
import { useUpdateStore } from "../../features/updates/update-store";
import { UpdatesCard } from "./updates-card";

const check = vi.fn();
const download = vi.fn();
const restart = vi.fn();

function seed(partial: Partial<ReturnType<typeof useUpdateStore.getState>>) {
  useUpdateStore.setState({
    status: "idle",
    update: null,
    progress: null,
    error: null,
    check,
    download,
    restart,
    ...partial,
  });
}

function renderCard(hasUnsavedChanges = false, onChangeUpdates?: () => void) {
  render(<UpdatesCard version="1.4.0" hasUnsavedChanges={hasUnsavedChanges} onChangeUpdates={onChangeUpdates} />);
}

describe("UpdatesCard", () => {
  beforeEach(() => {
    check.mockReset().mockResolvedValue(undefined);
    download.mockReset().mockResolvedValue(undefined);
    restart.mockReset().mockResolvedValue(undefined);
    seed({});
    useSettingsStore.getState().reset();
  });

  it("idle: shows the version and checks on demand", async () => {
    renderCard();

    expect(screen.getByText("Version 1.4.0")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Check for updates" }));
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("checking: disables the button and says so", () => {
    seed({ status: "checking" });
    renderCard();

    expect(screen.getByRole("button", { name: "Checking…" })).toBeDisabled();
  });

  it("up-to-date: says the app is current", () => {
    seed({ status: "up-to-date" });
    renderCard();

    expect(screen.getByText("You're up to date")).toBeInTheDocument();
  });

  it("available: shows the version and notes and downloads on demand", async () => {
    seed({ status: "available", update: { version: "1.5.0", notes: "Fixes", publishedAt: null } });
    renderCard();

    expect(screen.getByText(/1\.5\.0/)).toBeInTheDocument();
    expect(screen.getByText("Fixes")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Download update" }));
    expect(download).toHaveBeenCalledTimes(1);
    expect(restart).not.toHaveBeenCalled();
  });

  it("downloading: shows a progress bar", () => {
    seed({
      status: "downloading",
      update: { version: "1.5.0", notes: "", publishedAt: null },
      progress: { downloaded: 40, total: 100 },
    });
    renderCard();

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  });

  it("ready: says the update is downloaded, warns about the restart, and restarts on demand", async () => {
    seed({ status: "ready" });
    renderCard();

    expect(screen.getByText("Update downloaded")).toBeInTheDocument();
    expect(screen.getByText("Markora will close and reopen. Windows may ask for permission.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Restart to install" }));
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it("ready: blocks the restart while there are unsaved changes", () => {
    seed({ status: "ready" });
    renderCard(true);

    expect(screen.getByRole("button", { name: "Restart to install" })).toBeDisabled();
    expect(screen.getByText("Save your changes before restarting.")).toBeInTheDocument();
  });

  it("ready: shows the dirty-tab refusal from the store only once", () => {
    seed({ status: "ready", error: "Save your changes before restarting." });
    renderCard(true);

    expect(screen.getAllByText("Save your changes before restarting.")).toHaveLength(1);
  });

  it("ready: cannot be clicked twice while the restart is in flight", async () => {
    let finish!: () => void;
    restart.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    seed({ status: "ready" });
    renderCard();

    const button = screen.getByRole("button", { name: "Restart to install" });
    await userEvent.click(button);
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(restart).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    expect(button).toBeEnabled();
  });

  it("ready: shows an install error kept by the store", () => {
    seed({ status: "ready", error: "installer failed" });
    renderCard();

    expect(screen.getByRole("alert")).toHaveTextContent("installer failed");
    expect(screen.getByRole("button", { name: "Restart to install" })).toBeEnabled();
  });

  it("ready: shows the error when the restart fails instead of leaving it unhandled", async () => {
    restart.mockRejectedValue(new Error("relaunch failed"));
    seed({ status: "ready" });
    renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Restart to install" }));

    expect(await screen.findByText("relaunch failed")).toBeInTheDocument();
  });

  it("error: shows the message and retries", async () => {
    seed({ status: "error", error: "Network down" });
    renderCard();

    expect(screen.getByText("Network down")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("error after a found update: retries the download", async () => {
    seed({ status: "error", error: "Download failed", update: { version: "1.5.0", notes: "", publishedAt: null } });
    renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(download).toHaveBeenCalledTimes(1);
    expect(check).not.toHaveBeenCalled();
  });

  it("reflects and updates the automatic check setting", async () => {
    const onChangeUpdates = vi.fn();
    renderCard(false, onChangeUpdates);

    const toggle = screen.getByRole("switch", { name: "Check automatically" });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);

    expect(useSettingsStore.getState().settings.updates.checkAutomatically).toBe(false);
    expect(toggle).not.toBeChecked();
    expect(onChangeUpdates).toHaveBeenCalledTimes(1);
  });
});
