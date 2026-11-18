const PREVIEW_HEADINGS = ".preview-pane__content h1, .preview-pane__content h2, .preview-pane__content h3, .preview-pane__content h4, .preview-pane__content h5, .preview-pane__content h6";

/**
 * Scrolls the preview to the nth heading (the same index as in the outline). Returns false when there
 * is no preview, or when the preview has a different number of headings than the outline (for
 * example a heading written as raw HTML), because then the index can't be trusted.
 */
export function scrollPreviewToHeading(index: number, expectedCount: number): boolean {
  const headings = document.querySelectorAll(PREVIEW_HEADINGS);
  if (headings.length === 0 || headings.length !== expectedCount) return false;

  headings[index]?.scrollIntoView({ block: "start", behavior: "smooth" });
  return true;
}
