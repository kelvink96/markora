import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsFooter } from "./settings-footer";

describe("SettingsFooter", () => {
  it("shows the version and a privacy policy link", () => {
    render(<SettingsFooter version="1.2.3" privacyPolicyUrl="https://example.com/privacy" onResetAll={() => {}} />);

    expect(screen.getByText("Version 1.2.3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "https://example.com/privacy",
    );
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
