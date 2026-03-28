import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type TextElement = "p" | "span" | "div" | "label";
type TextSize = "xs" | "sm" | "md";
type TextTone = "default" | "muted" | "subtle" | "danger";
type TextWeight = "regular" | "medium" | "semibold";

type TextProps<T extends ElementType = "p"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  size?: TextSize;
  tone?: TextTone;
  weight?: TextWeight;
  truncate?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const sizeClasses: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
};

const toneClasses: Record<TextTone, string> = {
  default: "text-app-text",
  muted: "text-app-text-secondary",
  subtle: "text-app-text-muted",
  danger: "text-red-700",
};

const weightClasses: Record<TextWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Text<T extends ElementType = TextElement>({
  as,
  children,
  className,
  size = "sm",
  tone = "default",
  weight = "regular",
  truncate = false,
  ...props
}: TextProps<T>) {
  const Component = (as ?? "p") as ElementType;

  return (
    <Component
      className={joinClasses(
        "min-w-0",
        sizeClasses[size],
        toneClasses[tone],
        weightClasses[weight],
        truncate && "truncate",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
