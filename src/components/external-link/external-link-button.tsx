import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink } from "./external-link";

type ExternalLinkButtonProps = ComponentProps<typeof ExternalLink> & VariantProps<typeof buttonVariants>;

/** An ExternalLink that looks like a Button: still a real link, still opened through the LinkAdapter. */
export function ExternalLinkButton({ variant = "outline", size, className, ...props }: ExternalLinkButtonProps) {
  return (
    <ExternalLink
      className={cn(buttonVariants({ variant, size }), "no-underline underline-offset-0 hover:no-underline", className)}
      {...props}
    />
  );
}
