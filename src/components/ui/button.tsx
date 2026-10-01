"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer border border-transparent active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-bold border-primary/50 border-t-white/25 hover:bg-primary-hover shadow-sm",
        gold: "bg-gold text-primary-foreground font-bold border-gold/50 border-t-white/25 hover:opacity-90 shadow-sm",
        violation:
          "bg-violation/15 text-violation border-violation/35 border-t-violation/50 hover:bg-violation/25",
        secondary: "bg-secondary text-secondary-foreground border-border border-t-white/12 hover:bg-card-solid",
        outline: "border-border border-t-white/12 bg-card text-foreground hover:bg-card-solid",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]",
        danger: "bg-destructive/15 text-destructive border-destructive/35 border-t-destructive/50 hover:bg-destructive/25",
        glass: "bg-card/85 text-card-foreground border-border border-t-white/12 hover:bg-surface backdrop-blur-md",

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
  ({ className, variant, size, animate = true, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileTap={animate && !disabled ? { y: 2, filter: "brightness(0.86)" } : undefined}
        transition={{ type: "spring", stiffness: 600, damping: 28 }}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };