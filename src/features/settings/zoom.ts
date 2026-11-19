import { defaultSettings, EDITOR_FONT_SIZES, PREVIEW_SCALES, type AppearanceSettings } from "./settings-schema";

export type ZoomDirection = "in" | "out" | "reset";
export type ZoomState = Pick<AppearanceSettings, "editorFontSize" | "previewFontScale">;

/** The nearest allowed value strictly above or below `value`, or `value` itself at the end of the list. */
function step(values: number[], value: number, direction: "in" | "out"): number {
  if (direction === "in") return values.find((candidate) => candidate > value) ?? value;
  return [...values].reverse().find((candidate) => candidate < value) ?? value;
}

/** The next zoom level: both the editor font and the preview scale move one notch, each staying in its own range. */
export function stepZoom(state: ZoomState, direction: ZoomDirection): ZoomState {
  if (direction === "reset") {
    const { editorFontSize, previewFontScale } = defaultSettings.appearance;
    return { editorFontSize, previewFontScale };
  }

  return {
    editorFontSize: step(EDITOR_FONT_SIZES, state.editorFontSize, direction),
    previewFontScale: step(PREVIEW_SCALES, state.previewFontScale, direction),
  };
}

/** Whether the zoom command would change anything, so menus can disable it at the end of the range. */
export function canZoom(state: ZoomState, direction: ZoomDirection): boolean {
  const next = stepZoom(state, direction);
  return next.editorFontSize !== state.editorFontSize || next.previewFontScale !== state.previewFontScale;
}
