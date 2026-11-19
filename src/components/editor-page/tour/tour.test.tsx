import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const runnerLoaded = vi.fn();
vi.mock("./tour-runner", () => {
  runnerLoaded();
  return { default: () => <div>tour runner</div> };
});

import { Tour } from "./tour";

describe("Tour", () => {
  it("does not load the tour library until a tour starts", async () => {
    const { rerender } = render(<Tour run={false} onEnd={vi.fn()} />);

    expect(screen.queryByText("tour runner")).not.toBeInTheDocument();
    expect(runnerLoaded).not.toHaveBeenCalled();

    rerender(<Tour run onEnd={vi.fn()} />);

    expect(await screen.findByText("tour runner")).toBeInTheDocument();
    expect(runnerLoaded).toHaveBeenCalledTimes(1);
  });
});
