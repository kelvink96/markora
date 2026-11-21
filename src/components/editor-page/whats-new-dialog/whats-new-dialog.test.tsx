import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WhatsNewDialog } from "./whats-new-dialog";

const record = {
  version: "1.6.0",
  notes: "## What's Changed\n\n* feat: colour schemes",
  publishedAt: "2026-11-20T10:00:00Z",
};

describe("WhatsNewDialog", () => {
  it("shows the title with the version, the Updated pill and the notes rendered as markdown", async () => {
    render(<WhatsNewDialog record={record} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "What's new in 1.6.0" })).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "What's Changed" })).toBeInTheDocument();
    expect(screen.getByText("feat: colour schemes")).toBeInTheDocument();
  });

  it("shows the release date when publishedAt is a valid date", () => {
    render(<WhatsNewDialog record={record} onClose={vi.fn()} />);

    expect(screen.getByText(/^Released .*2026/)).toBeInTheDocument();
  });

  it.each([[null], ["not a date"]])("omits the release date when publishedAt is %s", (publishedAt) => {
    render(<WhatsNewDialog record={{ ...record, publishedAt }} onClose={vi.fn()} />);

    expect(screen.queryByText(/^Released/)).not.toBeInTheDocument();
  });

  it("Got it closes the dialog", async () => {
    const onClose = vi.fn();
    render(<WhatsNewDialog record={record} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Got it" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape closes the dialog", async () => {
    const onClose = vi.fn();
    render(<WhatsNewDialog record={record} onClose={onClose} />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("the close button closes the dialog", async () => {
    const onClose = vi.fn();
    render(<WhatsNewDialog record={record} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when there is no record", () => {
    render(<WhatsNewDialog record={null} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
