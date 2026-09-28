"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e]/60 active:scale-[0.97] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#3ecf8e] text-zinc-950 font-bold border border-[#3ecf8e]/50 shadow-sm hover:bg-[#4ade80] active:bg-[#24b47e]",
        gold: "bg-amber-400 text-zinc-950 font-bold border border-amber-400/50 shadow-sm hover:bg-amber-300",
        violation:
          "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30",
        secondary: "bg-[#242424] text-zinc-200 border border-white/10 hover:bg-[#2e2e2e]",
        outline: "border border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:border-white/20",
        ghost: "border border-white/10 text-zinc-300 hover:bg-white/[0.05]",
        danger: "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30",
        glass: "bg-[#171717] text-zinc-200 border border-white/10 hover:bg-[#222222]",
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