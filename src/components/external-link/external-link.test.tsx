import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExternalLink } from "./external-link";

const { openExternal } = vi.hoisted(() => ({ openExternal: vi.fn(() => Promise.resolve()) }));
vi.mock("../../platform/links", () => ({ getLinkAdapter: () => ({ openExternal }) }));

describe("ExternalLink", () => {
  beforeEach(() => openExternal.mockClear());

  it("is a real link to the address", () => {
    render(<ExternalLink href="https://example.com/privacy">Privacy policy</ExternalLink>);

    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "https://example.com/privacy");
  });

  // In the desktop webview a plain target="_blank" link does not reach the system browser.
  it("opens through the platform link adapter instead of letting the webview follow it", () => {
    render(<ExternalLink href="https://example.com/privacy">Privacy policy</ExternalLink>);

    const followed = fireEvent.click(screen.getByRole("link", { name: "Privacy policy" }));

    expect(openExternal).toHaveBeenCalledWith("https://example.com/privacy");
    expect(followed).toBe(false);
  });
});
