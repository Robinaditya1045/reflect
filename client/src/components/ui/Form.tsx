"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2 mb-4", className)}
        {...props}
      />
    );
  }
);
FormField.displayName = "FormField";

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: boolean;
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, error = false, ...props }, ref) => {
    if (!children) return null;
    
    return (
      <p
        ref={ref}
        className={cn(
          "text-sm font-medium",
          error ? "text-[#f85149]" : "text-[#8b949e]",
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);
FormMessage.displayName = "FormMessage";

export { FormField, FormMessage };
