"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-mono font-semibold tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary border border-primary/30",
        gold: "bg-gold/15 text-gold border border-gold/30",
        danger: "bg-destructive/15 text-destructive border border-destructive/30",
        info: "bg-info/15 text-info border border-info/30",
        neutral: "bg-surface text-muted-foreground border border-border",
        success: "bg-primary/15 text-primary border border-primary/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };