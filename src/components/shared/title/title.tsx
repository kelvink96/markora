import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type TitleElement = "h1" | "h2" | "h3" | "h4";
type TitleSize = "sm" | "md" | "lg" | "xl";
type TitleTone = "default" | "muted" | "accent";

type TitleProps<T extends ElementType = "h2"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  size?: TitleSize;
  tone?: TitleTone;
  truncate?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const sizeClasses: Record<TitleSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};

const toneClasses: Record<TitleTone, string> = {
  default: "text-app-text",
  muted: "text-app-text-secondary",
  accent: "text-app-accent",
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Title<T extends ElementType = TitleElement>({
  as,
  children,
  className,
  size = "md",
  tone = "default",
  truncate = false,
  ...props
}: TitleProps<T>) {
  const Component = (as ?? "h2") as ElementType;

  return (
    <Component
      className={joinClasses(
        "min-w-0 font-semibold tracking-[-0.02em]",
        sizeClasses[size],
        toneClasses[tone],
        truncate && "truncate",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
