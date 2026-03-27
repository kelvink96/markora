import "./live-preview-indicator.css";

export function LivePreviewIndicator() {
  return (
    <div className="live-preview-indicator" aria-label="Live Preview">
      <span className="live-preview-indicator__dot" />
      <span>Live Preview</span>
    </div>
  );
}
