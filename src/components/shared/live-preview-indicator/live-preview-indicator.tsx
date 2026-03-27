export function LivePreviewIndicator() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[0.84rem] font-medium text-app-text-secondary"
      aria-label="Live Preview"
    >
      <span className="size-2 rounded-full bg-app-accent" />
      <span>Live Preview</span>
    </div>
  );
}
