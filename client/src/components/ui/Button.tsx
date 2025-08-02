"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-[#1f6feb] text-white hover:bg-[#388bfd]",
        destructive: "bg-[#f85149] text-white hover:bg-[#ff6b64]",
        outline: "border border-[#30363d] bg-transparent hover:bg-[#30363d] text-white",
        secondary: "bg-[#21262d] text-white hover:bg-[#30363d] border border-[#30363d]",
        ghost: "bg-transparent hover:bg-[#30363d] text-white",
        link: "bg-transparent underline-offset-4 hover:underline text-white",
        success: "bg-[#238636] hover:bg-[#2ea043] text-white"
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
