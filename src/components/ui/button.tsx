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
          "bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(22,199,132,0.35)] hover:bg-primary/90",
        gold: "bg-gold text-black shadow-[0_8px_24px_rgba(245,158,11,0.3)] hover:bg-gold/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-white/10 bg-white/5 text-foreground hover:bg-white/10",
        ghost: "text-foreground hover:bg-white/5",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        glass: "glass text-foreground hover:bg-white/5",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-13 px-7 text-base",
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