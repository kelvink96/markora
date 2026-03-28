export function LivePreviewIndicator() {
  return (
    <div
      className="app-chip gap-2 px-2.5 py-1.5 text-[0.84rem] font-medium text-app-text-secondary"
      aria-label="Live Preview"
    >
      <span className="size-2 rounded-full bg-app-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_16%,transparent)]" />
      <span>Live Preview</span>
    </div>
  );
}
