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
      className={`app-surface p-5 ${className ?? ""}`}
      {...props}
    >
      {children}
    </Component>
  );
}
