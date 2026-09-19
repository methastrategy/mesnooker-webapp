"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-medium transition-all select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary/40 shadow-[0_1px_0_rgba(255,255,255,0.15),0_8px_24px_rgba(217,164,65,0.28)] hover:bg-primary/90",
        gold: "bg-gold text-black border border-gold/40 shadow-[0_1px_0_rgba(255,255,255,0.15),0_8px_24px_rgba(240,194,92,0.28)] hover:bg-gold/90",
        violation:
          "bg-violation text-black border border-violation/50 shadow-[0_1px_0_rgba(255,255,255,0.15),0_8px_24px_rgba(242,115,30,0.26)] hover:bg-violation/90",
        secondary: "bg-secondary text-secondary-foreground border border-secondary/40 hover:bg-secondary/80",
        outline: "border border-white/20 bg-white/5 text-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/10",
        ghost: "border border-white/10 text-foreground hover:bg-white/5",
        danger: "bg-destructive text-destructive-foreground border border-destructive/50 shadow-[0_1px_0_rgba(255,255,255,0.12),0_6px_18px_rgba(239,68,68,0.3)] hover:bg-destructive/90",
        glass: "glass text-foreground border border-white/15 hover:bg-white/5",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-13 px-7 text-base",
        // Tiles: equal-size big tap targets for the action pad / turn cluster
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
        whileTap={animate ? { scale: 0.95 } : undefined}
        whileHover={animate ? { scale: 1.02 } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };