"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase transition-colors shadow-xs",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary border border-primary/35",
        gold: "bg-gold/20 text-gold border border-gold/35",
        danger: "bg-destructive/20 text-destructive border border-destructive/35",
        info: "bg-info/20 text-info border border-info/35",
        neutral: "bg-surface/80 text-muted-foreground border border-border",
        success: "bg-primary/20 text-primary border border-primary/35",
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