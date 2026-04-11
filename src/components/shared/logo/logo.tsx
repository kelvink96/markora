interface LogoProps {
  className?: string;
  size?: number;
  showLabel?: boolean;
}

export function Logo({ className = "", size = 28, showLabel = false }: LogoProps) {
  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1024 1024"
          width={size}
          height={size}
          aria-label="Markora"
          role="img"
        >
          <image href="/logo_transparent.svg" width={1024} height={1024} />
        </svg>
        <span className="text-base font-semibold tracking-tight text-app-text">Markora</span>
      </span>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      aria-label="Markora"
      role="img"
    >
      <image href="/logo_transparent.svg" width={1024} height={1024} />
    </svg>
  );
}
