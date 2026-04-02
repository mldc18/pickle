"use client";

import { useAuth } from "@/context/auth-context";
import { useApp } from "@/context/app-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayerList } from "./player-list";
import { formatDayName, formatShortDate } from "@/lib/utils";
import { MAX_SLOTS } from "@/lib/constants";
import { CalendarDays, CheckCircle, XCircle, Ban, CreditCard, UserMinus, Users } from "lucide-react";

export function RegistrationPanel() {
  const { user } = useAuth();
  const {
    gameDay,
    registerForGame,
    unregisterFromGame,
    isRegistered,
    isWaitlisted,
    getWaitlistPosition,
    getRegistrationStatus,
  } = useApp();

  if (!user) return null;

  const status = getRegistrationStatus();
  const registered = isRegistered(user.id);
  const waitlisted = isWaitlisted(user.id);
  const waitPos = getWaitlistPosition(user.id);
  const filled = gameDay.registeredPlayers.length;

  function handleToggle() {
    if (registered || waitlisted) {
      unregisterFromGame(user!.id);
    } else {
      registerForGame(user!.id, user!.fullName);
    }
  }

  const canRegister = status === "open" && user.isPaid;
  const isBlocked = status === "blocked";

  return (
    <div className="flex flex-col gap-4">
      {/* Date, Status & Slots - Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{formatDayName(gameDay.date)}</CardTitle>
                <CardDescription className="text-sm">{formatShortDate(gameDay.date)}</CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Users className="h-3.5 w-3.5 text-muted" />
                <span>{filled}<span className="text-muted font-normal">/{MAX_SLOTS}</span></span>
              </div>
              {status === "not_open" && (
                <span className="text-[10px] text-muted">Opens 12 PM</span>
              )}
              {status === "open" && (
                <Badge variant="success" className="text-[10px]">Open</Badge>
              )}
              {status === "closed" && (
                <Badge variant="default" className="text-[10px]">Closed</Badge>
              )}
              {status === "blocked" && (
                <Badge variant="destructive" className="text-[10px]">Blocked</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Blocked Message */}
      {isBlocked && gameDay.blockMessage && (
        <div className="flex items-start gap-3 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
          <Ban className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Game Cancelled</p>
            <p className="text-sm text-muted mt-1">{gameDay.blockMessage}</p>
          </div>
        </div>
      )}

      {/* Status Messages & Action */}
      <div className="flex flex-col gap-3">
        {!user.isPaid && (
          <div className="flex items-start gap-2 text-sm text-warning bg-warning/10 rounded-lg p-3">
            <CreditCard className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Send payment and wait for admin to approve you so you can register for games.</span>
          </div>
        )}
        {status === "closed" && (
          <div className="flex items-start gap-2 text-sm text-muted bg-card-border/30 rounded-lg p-3">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Registration is closed for today.</span>
          </div>
        )}

        {registered ? (
          <Button variant="destructive" size="lg" className="w-full" onClick={handleToggle}>
            <UserMinus className="h-4 w-4" />
            Cancel Registration
          </Button>
        ) : waitlisted ? (
          <Button variant="destructive" size="lg" className="w-full" onClick={handleToggle}>
            <UserMinus className="h-4 w-4" />
            Leave Waitlist (#{waitPos})
          </Button>
        ) : (
          <Button size="lg" className="w-full" disabled={!canRegister} onClick={handleToggle}>
            <CheckCircle className="h-4 w-4" />
            Register for Today&#39;s Game
          </Button>
        )}
      </div>

      {/* Player List - no card wrapper */}
      <PlayerList
        players={gameDay.registeredPlayers}
        waitlist={gameDay.waitlist}
        currentUserId={user.id}
      />
    </div>
  );
}
