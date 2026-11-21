import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GithubCard } from "./github-card";

const { openExternal } = vi.hoisted(() => ({ openExternal: vi.fn(() => Promise.resolve()) }));
vi.mock("../../platform/links", () => ({ getLinkAdapter: () => ({ openExternal }) }));

describe("GithubCard", () => {
  beforeEach(() => openExternal.mockClear());

  it("is a labelled region about the project", () => {
    render(<GithubCard />);

    expect(screen.getByRole("region", { name: "Markora on GitHub" })).toBeInTheDocument();
  });

  it.each([
    ["Star on GitHub", "https://github.com/kelvink96/markora"],
    ["Releases", "https://github.com/kelvink96/markora/releases"],
    ["Send feedback", "https://github.com/kelvink96/markora/issues/new/choose"],
  ])("links %s to %s and opens it outside the app", async (name, href) => {
    render(<GithubCard />);

    const link = screen.getByRole("link", { name });
    expect(link).toHaveAttribute("href", href);
    await userEvent.click(link);
    expect(openExternal).toHaveBeenCalledWith(href);
  });
});
