import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type CardProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Card<T extends ElementType = "section">({
  as,
  children,
  className,
  ...props
}: CardProps<T>) {
  const Component = (as ?? "section") as ElementType;

  return (
    <Component
      className={`rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] p-5 backdrop-blur-[var(--glass-blur-soft)] shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_14px_36px_rgba(0,0,0,0.08)] ${className ?? ""}`}
      {...props}
    >
      {children}
    </Component>
  );
}
