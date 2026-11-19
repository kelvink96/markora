import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaceState } from "../workspace/workspace-state";
import { captureLayout, restoreLayout, stageStop } from "./tour-layout";
import { TOUR_STOPS } from "./tour-state";

const outlineStop = TOUR_STOPS.find((stop) => stop.panel === "outline")!;

describe("tour layout", () => {
  beforeEach(() => useWorkspaceState.setState({ showOutline: false }));

  it("has an outline stop anchored to the outline panel", () => {
    expect(outlineStop).toMatchObject({ target: '[data-tour="outline"]' });
  });

  it("opens a closed outline for the outline stop", () => {
    stageStop(outlineStop);
    expect(useWorkspaceState.getState().showOutline).toBe(true);
  });

  it("leaves an already open outline open, and does not touch panels for other stops", () => {
    useWorkspaceState.setState({ showOutline: true });
    stageStop(outlineStop);
    expect(useWorkspaceState.getState().showOutline).toBe(true);

    useWorkspaceState.setState({ showOutline: false });
    stageStop(TOUR_STOPS[0]);
    expect(useWorkspaceState.getState().showOutline).toBe(false);
  });

  it("restores a closed outline after the tour opened it", () => {
    const layout = captureLayout();
    stageStop(outlineStop);
    restoreLayout(layout);
    expect(useWorkspaceState.getState().showOutline).toBe(false);
  });

  it("restores an outline the user had open", () => {
    useWorkspaceState.setState({ showOutline: true });
    const layout = captureLayout();
    useWorkspaceState.setState({ showOutline: false });
    restoreLayout(layout);
    expect(useWorkspaceState.getState().showOutline).toBe(true);
  });
});
