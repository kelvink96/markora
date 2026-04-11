interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 28 }: LogoProps) {
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
