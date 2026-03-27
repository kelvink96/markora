export function LivePreviewIndicator() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-app-panel-strong px-3 py-2 text-sm font-medium text-app-text-secondary"
      aria-label="Live Preview"
    >
      <span className="size-2.5 rounded-full bg-app-accent" />
      <span>Live Preview</span>
    </div>
  );
}
