import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveFolderControl } from "./save-folder-control";

describe("SaveFolderControl", () => {
  it("says the system default applies when no folder is chosen", () => {
    render(<SaveFolderControl folder="" onChange={() => {}} onPickFolder={async () => null} />);

    expect(screen.getByText("System default")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose…" })).toBeInTheDocument();
  });

  it("shows the chosen folder and offers to change it", () => {
    render(<SaveFolderControl folder="/notes" onChange={() => {}} onPickFolder={async () => null} />);

    expect(screen.getByText("/notes")).toBeInTheDocument();
    expect(screen.queryByText("System default")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change…" })).toBeInTheDocument();
  });

  it("stores the folder picked in the dialog", async () => {
    const onChange = vi.fn();
    render(<SaveFolderControl folder="" onChange={onChange} onPickFolder={async () => "/picked"} />);

    await userEvent.click(screen.getByRole("button", { name: "Choose…" }));

    expect(onChange).toHaveBeenCalledWith("/picked");
  });

  it("changes nothing when the dialog is cancelled", async () => {
    const onChange = vi.fn();
    render(<SaveFolderControl folder="/notes" onChange={onChange} onPickFolder={async () => null} />);

    await userEvent.click(screen.getByRole("button", { name: "Change…" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("warns when the chosen folder no longer exists", async () => {
    render(
      <SaveFolderControl folder="/gone" onChange={() => {}} onPickFolder={async () => null} folderExists={async () => false} />,
    );

    expect(await screen.findByRole("status")).toHaveTextContent("no longer exists");
  });

  it("stays quiet when the folder is there, and when nothing is chosen", async () => {
    const folderExists = vi.fn(async () => true);
    const { rerender } = render(
      <SaveFolderControl folder="/notes" onChange={() => {}} onPickFolder={async () => null} folderExists={folderExists} />,
    );

    await waitFor(() => expect(folderExists).toHaveBeenCalledWith("/notes"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(<SaveFolderControl folder="" onChange={() => {}} onPickFolder={async () => null} folderExists={folderExists} />);
    expect(folderExists).toHaveBeenCalledTimes(1);
  });
});
