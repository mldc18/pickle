import { MAX_SLOTS } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";

interface SlotCounterProps {
  filled: number;
}

export function SlotCounter({ filled }: SlotCounterProps) {
  const pct = Math.min((filled / MAX_SLOTS) * 100, 100);
  const color =
    filled >= MAX_SLOTS
      ? "bg-destructive"
      : filled >= 20
        ? "bg-warning"
        : "bg-accent";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <Users className="h-4 w-4" />
          Slots
        </span>
        <span className="font-mono font-semibold text-base">
          {filled} / {MAX_SLOTS}
        </span>
      </div>
      <Progress value={pct} indicatorClassName={color} />
    </div>
  );
}
