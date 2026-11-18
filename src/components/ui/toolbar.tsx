import * as React from "react"
import { Toolbar as ToolbarPrimitive } from "radix-ui"
import type { VariantProps } from "class-variance-authority"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/*
 * A shadcn-style wrapper around Radix's Toolbar. Unlike a plain row of buttons it gives the
 * group one tab stop and arrow-key navigation between the buttons (roving focus), as the
 * ARIA toolbar pattern asks.
 */
function Toolbar({ className, ...props }: React.ComponentProps<typeof ToolbarPrimitive.Root>) {
  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function ToolbarButton({
  className,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Button> & VariantProps<typeof buttonVariants>) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function ToolbarSeparator({ className, ...props }: React.ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn("mx-1 h-5 w-px shrink-0 bg-border", className)}
      {...props}
    />
  )
}

export { Toolbar, ToolbarButton, ToolbarSeparator }
