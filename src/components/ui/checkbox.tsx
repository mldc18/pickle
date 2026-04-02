"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className={cn("peer sr-only", className)}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          {...props}
        />
        <div className="h-4 w-4 shrink-0 rounded border border-input-border bg-input-bg ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 peer-checked:bg-accent peer-checked:border-accent flex items-center justify-center cursor-pointer">
          {props.checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
