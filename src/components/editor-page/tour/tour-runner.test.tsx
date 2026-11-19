import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { useWorkspaceState } from "../../../features/workspace/workspace-state";

vi.mock("react-joyride", () => ({ Joyride: () => null }));

import TourRunner from "./tour-runner";

describe("TourRunner layout", () => {
  beforeEach(() => useWorkspaceState.setState({ showOutline: false }));

  it("restores the panel layout when the tour goes away, however it ended", () => {
    const { unmount } = render(<TourRunner onEnd={vi.fn()} />);
    useWorkspaceState.setState({ showOutline: true }); // staged by the outline stop

    unmount();

    expect(useWorkspaceState.getState().showOutline).toBe(false);
  });
});
