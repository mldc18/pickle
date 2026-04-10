"use client";

import { RegisteredPlayer } from "@/lib/schemas";
import { MAX_SLOTS } from "@/lib/constants";
import { cn } from "@/lib/cn";

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
  ["#60A5FA", "#93C5FD"],
  ["#E879F9", "#F0ABFC"],
  ["#4ADE80", "#86EFAC"],
  ["#F97316", "#FDBA74"],
  ["#14B8A6", "#5EEAD4"],
  ["#A855F7", "#D8B4FE"],
];

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function getGradient(index: number): [string, string] {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] as [string, string];
}

export function PlayerList({ players, waitlist, currentUserId }: PlayerListProps) {
  const emptySlots = Math.max(0, MAX_SLOTS - players.length);

  return (
    <div className="flex flex-col gap-6">
      {/* Section Label */}
      <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted">Registered</span>
        <span className="text-[10px] font-bold bg-accent-soft text-accent-hover px-2.5 py-0.5 rounded-full border border-accent/15">
          {players.length}
        </span>
      </div>

      {/* 6×4 Player Grid */}
      <div className="grid grid-cols-6 gap-2 animate-fade-up" style={{ animationDelay: "0.25s" }}>
        {players.map((p, i) => {
          const isCurrentUser = p.userId === currentUserId;
          const [from, to] = getGradient(i);
          return (
            <div
              key={p.userId}
              className="flex flex-col items-center gap-1.5 py-1.5 animate-pop"
              style={{ animationDelay: `${0.3 + i * 0.02}s` }}
            >
              <div
                className="w-[46px] h-[46px] rounded-[13px] overflow-hidden flex items-center justify-center text-[14px] font-extrabold text-white shadow-sm transition-transform hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              >
                {p.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatarUrl} alt={p.fullName} className="w-full h-full object-cover" />
                ) : (
                  isCurrentUser ? "YOU" : getInitials(p.fullName)
                )}
              </div>
              <span className={cn(
                "text-[11px] font-semibold text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full",
                isCurrentUser ? "text-accent-hover" : "text-foreground"
              )}>
                {isCurrentUser ? "You" : getShortName(p.fullName)}
              </span>
            </div>
          );
        })}

        {/* Empty Slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex flex-col items-center gap-1.5 py-1.5 opacity-25 animate-pop"
            style={{ animationDelay: `${0.3 + (players.length + i) * 0.02}s` }}
          >
            <div className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center text-base text-text-muted bg-[#DDDDD8] border-[1.5px] border-dashed border-[#C5C5BE]">
              +
            </div>
            <span className="text-[11px] font-semibold text-text-muted">Open</span>
          </div>
        ))}
      </div>

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <>
          <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <span className="text-[11px] font-bold tracking-[2px] uppercase text-warning-dark">Waitlist</span>
            <span className="text-[10px] font-bold bg-warning-soft text-warning-dark px-2.5 py-0.5 rounded-full border border-warning/20">
              {waitlist.length}
            </span>
          </div>
          <div className="flex gap-3.5 animate-fade-up" style={{ animationDelay: "0.45s" }}>
            {waitlist.map((p, i) => {
              const isCurrentUser = p.userId === currentUserId;
              const [from, to] = getGradient(players.length + i);
              return (
                <div key={p.userId} className="flex flex-col items-center gap-1.5 py-1.5">
                  <div
                    className="w-[46px] h-[46px] rounded-[13px] overflow-hidden flex items-center justify-center text-[14px] font-extrabold text-white opacity-40"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatarUrl} alt={p.fullName} className="w-full h-full object-cover" />
                    ) : (
                      isCurrentUser ? "YOU" : getInitials(p.fullName)
                    )}
                  </div>
                  <span className={cn(
                    "text-[11px] font-semibold",
                    isCurrentUser ? "text-warning-dark" : "text-muted"
                  )}>
                    {isCurrentUser ? "You" : getShortName(p.fullName)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
