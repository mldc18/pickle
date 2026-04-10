"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight, Ban, Lock, Unlock, UserX, UserCheck } from "lucide-react";

export default function CalendarPage() {
  const { isAdmin } = useAuth();
  const { blockedDates, blockDate, unblockDate, getGameDay, toggleNoShow } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState("");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function prevMonth() { setCurrentMonth(new Date(year, month - 1, 1)); setSelectedDay(null); }
  function nextMonth() { setCurrentMonth(new Date(year, month + 1, 1)); setSelectedDay(null); }

  function getDateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isBlocked(day: number): boolean {
    return blockedDates.some((b) => b.date === getDateStr(day));
  }

  function getBlockMessage(day: number): string | undefined {
    return blockedDates.find((b) => b.date === getDateStr(day))?.message;
  }

  function isToday(day: number): boolean {
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  }

  function isPast(day: number): boolean {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }

  function isPlayable(day: number): boolean {
    return !isPast(day) && !isBlocked(day);
  }

  function getPlayerCount(day: number): number | undefined {
    const gd = getGameDay(getDateStr(day));
    return gd ? gd.registeredPlayers.length : undefined;
  }

  function handleBlock() {
    if (selectedDay && blockReason.trim()) {
      blockDate(getDateStr(selectedDay), blockReason.trim());
      setBlockReason("");
    }
  }

  function handleUnblock() {
    if (selectedDay) {
      unblockDate(getDateStr(selectedDay));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Month Navigation */}
      <div className="relative bg-card border border-card-border rounded-[16px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden animate-fade-up">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, var(--accent), var(--warning))" }} />
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-[17px] font-extrabold tracking-[-0.3px]">{monthName}</span>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-text-muted py-1 uppercase tracking-[1px]">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const blocked = isBlocked(day);
            const todayDay = isToday(day);
            const past = isPast(day);
            const playable = isPlayable(day);
            const selected = selectedDay === day;
            const count = getPlayerCount(day);

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(selected ? null : day)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-[8px] text-sm transition-all h-12",
                  past && !todayDay && "text-text-muted",
                  blocked && !past && "bg-destructive/10 text-destructive",
                  playable && !todayDay && "bg-accent-soft text-accent-hover hover:bg-accent/15",
                  todayDay && !selected && "bg-accent/15 text-accent-hover font-bold ring-2 ring-accent/30",
                  selected && "bg-accent text-white font-bold",
                )}
              >
                <span className="font-semibold">{day}</span>
                {count !== undefined && count > 0 && (
                  <span className={cn(
                    "text-[8px] leading-none font-bold",
                    selected ? "text-white/70" : past ? "text-text-muted" : "text-muted"
                  )}>
                    {count}p
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-[10px] font-semibold text-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Open
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            Closed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-bold">Xp</span>
            = players
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (() => {
        const dateStr = getDateStr(selectedDay);
        const blocked = isBlocked(selectedDay);
        const blockMsg = getBlockMessage(selectedDay);
        const todayDay = isToday(selectedDay);
        const past = isPast(selectedDay);
        const gd = getGameDay(dateStr);
        const dateLabel = new Date(year, month, selectedDay).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        return (
          <div className="rounded-[16px] bg-card border border-card-border p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[15px] font-bold">{dateLabel}</p>
              <div className="flex items-center gap-2">
                {gd && <span className="text-[11px] font-semibold text-muted">{gd.registeredPlayers.length} players</span>}
                {blocked ? (
                  <Badge variant="destructive">Closed</Badge>
                ) : past ? (
                  <Badge variant="default">Past</Badge>
                ) : (
                  <Badge variant="success">Open</Badge>
                )}
              </div>
            </div>

            {blocked && blockMsg && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-[8px] p-3 mb-3">
                <Ban className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-medium">{blockMsg}</span>
              </div>
            )}

            {!blocked && !past && !gd && (
              <p className="text-sm text-muted mb-3">
                {todayDay ? "Play is available today. Head to the Play tab to register." : "Play is available on this date."}
              </p>
            )}

            {/* Player list with no-show toggles for past dates (admin only) */}
            {isAdmin && gd && gd.registeredPlayers.length > 0 && (past || todayDay) && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted">Players</span>
                  {gd.noShows.length > 0 && (
                    <Badge variant="destructive" className="text-[8px]">
                      {gd.noShows.length} no-show{gd.noShows.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                  {gd.registeredPlayers.map((p, idx) => {
                    const isNoShow = gd.noShows.includes(p.userId);
                    return (
                      <div
                        key={p.userId}
                        className={cn(
                          "flex items-center justify-between rounded-[8px] px-2.5 py-2 text-xs",
                          isNoShow ? "bg-destructive/5" : "bg-background"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted font-bold w-4">{idx + 1}</span>
                          <span className={cn("font-semibold", isNoShow && "line-through text-muted")}>{p.fullName}</span>
                        </div>
                        {isAdmin && past && (
                          <button
                            onClick={() => toggleNoShow(dateStr, p.userId)}
                            className={cn(
                              "flex items-center gap-1 rounded-[100px] px-2 py-0.5 text-[10px] font-bold transition-colors",
                              isNoShow
                                ? "bg-accent-soft text-accent-hover hover:bg-accent/20"
                                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            )}
                          >
                            {isNoShow ? (
                              <><UserCheck className="h-3 w-3" /> Showed</>
                            ) : (
                              <><UserX className="h-3 w-3" /> No-show</>
                            )}
                          </button>
                        )}
                        {!isAdmin && isNoShow && (
                          <Badge variant="destructive" className="text-[8px]">No-show</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admin controls for future dates */}
            {isAdmin && !past && (
              <div className="border-t border-card-border pt-3">
                {blocked ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={handleUnblock}>
                    <Unlock className="h-4 w-4" />
                    Open This Date
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="block-reason" className="text-[11px] font-bold">Reason for closing</Label>
                      <Input
                        id="block-reason"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="e.g., Court maintenance"
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button variant="destructive" size="sm" className="w-full" onClick={handleBlock} disabled={!blockReason.trim()}>
                      <Lock className="h-4 w-4" />
                      Close This Date
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
