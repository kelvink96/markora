import { describe, expect, it } from "vitest";
import { canZoom, stepZoom } from "./zoom";

describe("stepZoom", () => {
  it("steps both the editor font and the preview scale up one notch", () => {
    expect(stepZoom({ editorFontSize: 16, previewFontScale: 1 }, "in")).toEqual({
      editorFontSize: 18,
      previewFontScale: 1.1,
    });
  });

  it("steps both down one notch", () => {
    expect(stepZoom({ editorFontSize: 16, previewFontScale: 1 }, "out")).toEqual({
      editorFontSize: 15,
      previewFontScale: 0.9,
    });
  });

  it("stays put at the top of the range and reports it cannot zoom in", () => {
    const top = { editorFontSize: 24, previewFontScale: 1.5 };

    expect(stepZoom(top, "in")).toEqual(top);
    expect(canZoom(top, "in")).toBe(false);
    expect(canZoom(top, "out")).toBe(true);
  });

  it("stays put at the bottom of the range and reports it cannot zoom out", () => {
    const bottom = { editorFontSize: 12, previewFontScale: 0.9 };

    expect(stepZoom(bottom, "out")).toEqual(bottom);
    expect(canZoom(bottom, "out")).toBe(false);
    expect(canZoom(bottom, "in")).toBe(true);
  });

  it("moves to the next allowed value when the stored value is not on the list", () => {
    const offList = { editorFontSize: 17, previewFontScale: 1.05 };

    expect(stepZoom(offList, "in")).toEqual({ editorFontSize: 18, previewFontScale: 1.1 });
    expect(stepZoom(offList, "out")).toEqual({ editorFontSize: 16, previewFontScale: 1 });
  });

  it("keeps stepping the axis that has room when the other is maxed", () => {
    const state = { editorFontSize: 24, previewFontScale: 1 };

    expect(stepZoom(state, "in")).toEqual({ editorFontSize: 24, previewFontScale: 1.1 });
    expect(canZoom(state, "in")).toBe(true);
  });

  it("resets to the defaults, and is a no-op there", () => {
    expect(stepZoom({ editorFontSize: 20, previewFontScale: 1.25 }, "reset")).toEqual({
      editorFontSize: 16,
      previewFontScale: 1,
    });
    expect(canZoom({ editorFontSize: 16, previewFontScale: 1 }, "reset")).toBe(false);
    expect(canZoom({ editorFontSize: 20, previewFontScale: 1 }, "reset")).toBe(true);
  });
});
