import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsFooter } from "./settings-footer";

const { openExternal } = vi.hoisted(() => ({ openExternal: vi.fn(() => Promise.resolve()) }));
vi.mock("../../platform/links", () => ({ getLinkAdapter: () => ({ openExternal }) }));

describe("SettingsFooter", () => {
  it("shows the version and a privacy policy link that opens outside the app", async () => {
    render(<SettingsFooter version="1.2.3" privacyPolicyUrl="https://example.com/privacy" onResetAll={() => {}} />);

    expect(screen.getByText("Version 1.2.3")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /privacy policy/i });
    expect(link).toHaveAttribute("href", "https://example.com/privacy");
    await userEvent.click(link);
    expect(openExternal).toHaveBeenCalledWith("https://example.com/privacy");
  });

  it("resets everything only after confirming", async () => {
    const onResetAll = vi.fn();
    render(<SettingsFooter version="1.0.0" privacyPolicyUrl="https://example.com" onResetAll={onResetAll} />);

    await userEvent.click(screen.getByRole("button", { name: "Reset all settings" }));
    expect(onResetAll).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Reset everything" }));

    expect(onResetAll).toHaveBeenCalledTimes(1);
  });
});
