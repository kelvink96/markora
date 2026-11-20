import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppDialogs } from "./app-dialogs";

const { openExternal } = vi.hoisted(() => ({ openExternal: vi.fn(() => Promise.resolve()) }));
vi.mock("../../../platform/links", () => ({ getLinkAdapter: () => ({ openExternal }) }));

function renderDialogs(overrides: Partial<Parameters<typeof AppDialogs>[0]> = {}) {
  const handlers = {
    onCancelClose: vi.fn(),
    onConfirmClose: vi.fn(),
    onShortcutsOpenChange: vi.fn(),
    onAboutOpenChange: vi.fn(),
    onReleaseNotesOpenChange: vi.fn(),
  };
  render(
    <AppDialogs
      version="9.9.9"
      pendingCloseRequest={null}
      shortcutsOpen={false}
      aboutOpen={false}
      releaseNotesOpen={false}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

describe("AppDialogs", () => {
  it("shows nothing until a dialog is asked for", () => {
    renderDialogs();

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("discard unsaved changes", () => {
    it("is an alert dialog that asks about one tab", () => {
      renderDialogs({ pendingCloseRequest: { type: "single", documentId: "d1" } });

      const dialog = screen.getByRole("alertdialog", { name: "Discard unsaved changes?" });
      expect(within(dialog).getByText(/Discard them and close the tab\?/)).toBeInTheDocument();
    });

    it("words the question differently when closing every tab", () => {
      renderDialogs({ pendingCloseRequest: { type: "all" } });

      expect(screen.getByText(/close every tab\?/)).toBeInTheDocument();
      expect(screen.getByText(/across your open documents/)).toBeInTheDocument();
    });

    it("discards when confirmed", async () => {
      const user = userEvent.setup();
      const handlers = renderDialogs({ pendingCloseRequest: { type: "single", documentId: "d1" } });

      await user.click(screen.getByRole("button", { name: "Discard" }));

      expect(handlers.onConfirmClose).toHaveBeenCalledTimes(1);
      expect(handlers.onCancelClose).not.toHaveBeenCalled();
    });

    it("keeps the document when cancelled", async () => {
      const user = userEvent.setup();
      const handlers = renderDialogs({ pendingCloseRequest: { type: "single", documentId: "d1" } });

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(handlers.onCancelClose).toHaveBeenCalledTimes(1);
      expect(handlers.onConfirmClose).not.toHaveBeenCalled();
    });

    it("closes on Escape without discarding (#6)", async () => {
      const user = userEvent.setup();
      const handlers = renderDialogs({ pendingCloseRequest: { type: "single", documentId: "d1" } });

      await user.keyboard("{Escape}");

      expect(handlers.onCancelClose).toHaveBeenCalledTimes(1);
      expect(handlers.onConfirmClose).not.toHaveBeenCalled();
    });

    it("moves focus into the dialog and keeps Tab inside it (#6)", async () => {
      const user = userEvent.setup();
      renderDialogs({ pendingCloseRequest: { type: "single", documentId: "d1" } });
      const dialog = screen.getByRole("alertdialog");

      expect(dialog.contains(document.activeElement)).toBe(true);
      for (let presses = 0; presses < 6; presses += 1) {
        await user.tab();
        expect(dialog.contains(document.activeElement)).toBe(true);
      }
    });
  });

  describe("keyboard shortcuts", () => {
    it("lists each shortcut with the platform's modifier", () => {
      renderDialogs({ shortcutsOpen: true });

      const dialog = screen.getByRole("dialog", { name: "Keyboard Shortcuts" });
      expect(within(dialog).getByText("Ctrl+N")).toBeInTheDocument();
      expect(within(dialog).getByText("Ctrl+Shift+S")).toBeInTheDocument();
      expect(within(dialog).getByText("Next tab")).toBeInTheDocument();
    });

    it("closes from its Close button and from Escape", async () => {
      const user = userEvent.setup();
      const handlers = renderDialogs({ shortcutsOpen: true });

      await user.click(screen.getAllByRole("button", { name: "Close" })[0]);
      await user.keyboard("{Escape}");

      expect(handlers.onShortcutsOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows the version and a privacy link in About that opens outside the app", async () => {
    renderDialogs({ aboutOpen: true });

    const dialog = screen.getByRole("dialog", { name: "About Markora" });
    expect(within(dialog).getByText("Version 9.9.9")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("link", { name: "Privacy Policy" }));
    expect(openExternal).toHaveBeenCalledWith("https://kelvink96.github.io/markora/privacy");
  });

  it("points release notes at the releases page", () => {
    renderDialogs({ releaseNotesOpen: true });

    const dialog = screen.getByRole("dialog", { name: "Release Notes" });
    expect(within(dialog).getByText("Version 9.9.9")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "View all releases" })).toHaveAttribute(
      "href",
      "https://kelvink96.github.io/markora/versions",
    );
  });
});
