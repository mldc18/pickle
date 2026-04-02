"use client";

import { useState } from "react";
import { RegisteredPlayer } from "@/lib/types";
import { MAX_SLOTS } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Clock, ChevronDown, ChevronUp, UserCheck } from "lucide-react";

interface PlayerListProps {
  players: RegisteredPlayer[];
  waitlist: RegisteredPlayer[];
  currentUserId?: string;
}

const INITIAL_SHOW = 4;

export function PlayerList({ players, waitlist, currentUserId }: PlayerListProps) {
  const [expanded, setExpanded] = useState(false);
  const emptySlots = Math.max(0, MAX_SLOTS - players.length);

  const visiblePlayers = expanded ? players : players.slice(0, INITIAL_SHOW);
  const hiddenCount = players.length - INITIAL_SHOW;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <UserCheck className="h-4 w-4 text-accent" />
          Registered Players
        </h4>
        <span className="text-xs text-muted">{players.length} joined</span>
      </div>

      <div className="flex flex-col gap-1">
        {visiblePlayers.map((p, i) => (
          <div
            key={p.userId}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              p.userId === currentUserId
                ? "bg-accent/10 border border-accent/20 font-medium"
                : "bg-background hover:bg-card-border/20"
            )}
          >
            <span className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
              p.userId === currentUserId ? "bg-accent text-white" : "bg-card-border/60 text-muted"
            )}>
              {i + 1}
            </span>
            <span className="flex-1">{p.fullName}</span>
            {p.userId === currentUserId && (
              <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">You</span>
            )}
          </div>
        ))}

        {/* Show More / Show Less */}
        {hiddenCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted text-xs h-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {hiddenCount} more
              </>
            )}
          </Button>
        )}

        {/* Empty slots only when expanded */}
        {expanded && Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 rounded-lg border border-dashed border-card-border/50 px-3 py-2.5 text-sm"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card-border/30 text-[10px] text-muted">
              {players.length + i + 1}
            </span>
            <span className="text-muted/50">Open slot</span>
          </div>
        ))}
      </div>

      {waitlist.length > 0 && (
        <>
          <Separator className="my-2" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-warning" />
            <h4 className="text-sm font-semibold text-warning">Waitlist</h4>
          </div>
          <div className="flex flex-col gap-1">
            {waitlist.map((p, i) => (
              <div
                key={p.userId}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  p.userId === currentUserId
                    ? "bg-warning/10 border border-warning/20 font-medium"
                    : "bg-background hover:bg-card-border/20"
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-[10px] font-bold text-warning">
                  {i + 1}
                </span>
                <span className="flex-1">{p.fullName}</span>
                {p.userId === currentUserId && (
                  <span className="text-[10px] font-semibold text-warning uppercase tracking-wider">You</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
