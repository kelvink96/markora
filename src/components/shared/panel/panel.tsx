import type { HTMLAttributes, PropsWithChildren } from "react";

export function Panel({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`app-surface ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
