import type { PreviewSettings } from "../settings/settings-schema";

/** The preview's line length for each content width setting. Focus centers the editor at the same measure. */
export const CONTENT_WIDTH_MEASURE: Record<PreviewSettings["contentWidth"], string> = {
  narrow: "60ch",
  normal: "72ch",
  wide: "90ch",
};
