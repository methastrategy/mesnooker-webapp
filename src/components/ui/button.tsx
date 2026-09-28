"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] font-medium transition-all select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer border border-transparent",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-bold border-primary/50 hover:bg-primary-hover",
        gold: "bg-gold text-primary-foreground font-bold border-gold/50 hover:opacity-90",
        violation:
          "bg-violation/20 text-violation border-violation/40 hover:bg-violation/30",
        secondary: "bg-secondary text-secondary-foreground border-border hover:bg-[#1a1b1d]",
        outline: "border-border bg-transparent text-foreground hover:bg-white/[0.05]",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]",
        danger: "bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/30",
        glass: "bg-card text-card-foreground border-border hover:bg-surface",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-6 text-base",
        tile: "h-14 min-w-14 px-3.5 text-sm",
        icon: "h-11 w-11",
        iconSm: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {
  animate?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animate = true, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={animate ? { scale: 0.96 } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };