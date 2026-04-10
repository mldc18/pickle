import * as React from "react";
import { cn } from "@/lib/cn";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-[12px] border-[1.5px] border-transparent bg-input-bg px-4 py-3.5 text-[15px] font-medium text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-white focus:shadow-[0_0_0_3px_rgba(52,211,153,0.1)] transition-all disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
