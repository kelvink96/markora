interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-2 bg-red-600 px-4 py-2 text-sm text-white"
    >
      <span>{message}</span>
      <button
        aria-label="Dismiss"
        onClick={onDismiss}
        className="shrink-0 rounded px-2 py-0.5 hover:bg-red-700"
      >
        ✕
      </button>
    </div>
  );
}
