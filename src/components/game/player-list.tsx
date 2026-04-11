"use client";

import { RegisteredPlayer } from "@/lib/schemas";
import { cn } from "@/lib/cn";
import { Clock, UserCheck } from "lucide-react";

interface PlayerListProps {
  players: RegisteredPlayer[];
  waitlist: RegisteredPlayer[];
  currentUserId?: string;
}

const AVATAR_GRADIENTS = [
  ["#34D399", "#6EE7B7"],
  ["#A78BFA", "#C4B5FD"],
  ["#38BDF8", "#7DD3FC"],
  ["#FB7185", "#FDA4AF"],
  ["#FBBF24", "#FDE68A"],
  ["#2DD4BF", "#99F6E4"],
  ["#F472B6", "#F9A8D4"],
  ["#818CF8", "#C7D2FE"],
  ["#FB923C", "#FDBA74"],
  ["#22D3EE", "#67E8F9"],
  ["#C084FC", "#DDD6FE"],
  ["#F87171", "#FCA5A5"],
];

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradient(index: number): [string, string] {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] as [string, string];
}

function PlayerRow({
  player,
  index,
  currentUserId,
  dimmed = false,
}: {
  player: RegisteredPlayer;
  index: number;
  currentUserId?: string;
  dimmed?: boolean;
}) {
  const isCurrentUser = player.userId === currentUserId;
  const [from, to] = getGradient(index);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[12px] px-3 py-2 transition-colors animate-fade-up",
        isCurrentUser
          ? dimmed
            ? "bg-warning-soft border border-warning/20"
            : "bg-accent-soft border border-accent/20"
          : "bg-background hover:bg-card-border/20 border border-transparent",
      )}
      style={{ animationDelay: `${0.25 + index * 0.02}s` }}
    >
      <div
        className={cn(
          "h-11 w-11 rounded-[12px] overflow-hidden flex items-center justify-center text-[13px] font-extrabold text-white shadow-sm shrink-0",
          dimmed && "opacity-60",
        )}
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {player.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.avatarUrl}
            alt={player.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(player.fullName)
        )}
      </div>
      <span
        className={cn(
          "flex-1 text-[14px] font-semibold truncate",
          isCurrentUser
            ? dimmed
              ? "text-warning-dark"
              : "text-accent-hover"
            : "text-foreground",
        )}
      >
        {player.fullName}
      </span>
      {isCurrentUser && (
        <span
          className={cn(
            "text-[9px] font-extrabold uppercase tracking-[1.5px] px-2 py-0.5 rounded-full",
            dimmed
              ? "bg-warning text-warning-dark"
              : "bg-accent text-white",
          )}
        >
          You
        </span>
      )}
    </div>
  );
}

export function PlayerList({ players, waitlist, currentUserId }: PlayerListProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Registered */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <UserCheck className="h-3.5 w-3.5 text-accent-hover" />
          <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted">
            Registered
          </span>
          <span className="text-[10px] font-bold bg-accent-soft text-accent-hover px-2.5 py-0.5 rounded-full border border-accent/15">
            {players.length}
          </span>
        </div>

        {players.length === 0 ? (
          <p className="text-[12px] text-text-muted font-medium italic py-2">
            No one has registered yet — be the first!
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {players.map((p, i) => (
              <PlayerRow
                key={p.userId}
                player={p}
                index={i}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "0.35s" }}>
            <Clock className="h-3.5 w-3.5 text-warning-dark" />
            <span className="text-[11px] font-bold tracking-[2px] uppercase text-warning-dark">
              Waitlist
            </span>
            <span className="text-[10px] font-bold bg-warning-soft text-warning-dark px-2.5 py-0.5 rounded-full border border-warning/20">
              {waitlist.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {waitlist.map((p, i) => (
              <PlayerRow
                key={p.userId}
                player={p}
                index={i}
                currentUserId={currentUserId}
                dimmed
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
