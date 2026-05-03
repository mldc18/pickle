import { DEFAULT_MAX_PLAYERS } from "@/lib/capacity";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";

interface SlotCounterProps {
  filled: number;
  capacity?: number;
}

export function SlotCounter({ filled, capacity = DEFAULT_MAX_PLAYERS }: SlotCounterProps) {
  const pct = Math.min((filled / capacity) * 100, 100);
  const color =
    filled >= capacity
      ? "bg-destructive"
      : filled >= Math.floor(capacity * 0.84)
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
          {filled} / {capacity}
        </span>
      </div>
      <Progress value={pct} indicatorClassName={color} />
    </div>
  );
}
