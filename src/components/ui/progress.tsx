import * as React from "react";
import { cn } from "@/lib/cn";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-card-border/40", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", indicatorClassName || "bg-accent")}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
);
Progress.displayName = "Progress";

export { Progress };
