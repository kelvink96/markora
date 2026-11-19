import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSettingsStore } from "../../features/settings/settings-store";
import { useUpdateStore } from "../../features/updates/update-store";
import { UpdatesCard } from "./updates-card";

const check = vi.fn();
const install = vi.fn();
const restart = vi.fn();

function seed(partial: Partial<ReturnType<typeof useUpdateStore.getState>>) {
  useUpdateStore.setState({
    status: "idle",
    update: null,
    progress: null,
    error: null,
    check,
    install,
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
    install.mockReset().mockResolvedValue(undefined);
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

  it("available: shows the version and notes and installs on demand", async () => {
    seed({ status: "available", update: { version: "1.5.0", notes: "Fixes", publishedAt: null } });
    renderCard();

    expect(screen.getByText(/1\.5\.0/)).toBeInTheDocument();
    expect(screen.getByText("Fixes")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Install update" }));
    expect(install).toHaveBeenCalledTimes(1);
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

  it("ready: restarts on demand", async () => {
    seed({ status: "ready" });
    renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Restart to finish" }));
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it("ready: blocks the restart while there are unsaved changes", () => {
    seed({ status: "ready" });
    renderCard(true);

    expect(screen.getByRole("button", { name: "Restart to finish" })).toBeDisabled();
    expect(screen.getByText("Save your changes before restarting.")).toBeInTheDocument();
  });

  it("ready: shows the error when the restart fails instead of leaving it unhandled", async () => {
    restart.mockRejectedValue(new Error("relaunch failed"));
    seed({ status: "ready" });
    renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Restart to finish" }));

    expect(await screen.findByText("relaunch failed")).toBeInTheDocument();
  });

  it("error: shows the message and retries", async () => {
    seed({ status: "error", error: "Network down" });
    renderCard();

    expect(screen.getByText("Network down")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("error after a found update: retries the install", async () => {
    seed({ status: "error", error: "Download failed", update: { version: "1.5.0", notes: "", publishedAt: null } });
    renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(install).toHaveBeenCalledTimes(1);
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
