"use client";

import { useAuth } from "@/context/auth-context";
import { useApp } from "@/context/app-context";
import { PlayerList } from "./player-list";
import { formatFullDate } from "@/lib/utils";
import { MAX_SLOTS } from "@/lib/constants";
import { Ban, CreditCard } from "lucide-react";

export function RegistrationPanel() {
  const { user, isAdmin } = useAuth();
  const {
    ready,
    gameDay,
    getRegistrationStatus,
    users,
    registerForGame,
    unregisterFromGame,
    isRegistered,
    isWaitlisted,
    getWaitlistPosition,
  } = useApp();

  if (!user) return null;

  const status = getRegistrationStatus();
  const filled = gameDay.registeredPlayers.length;
  const fillPercent = Math.round((filled / MAX_SLOTS) * 100);
  const isBlocked = status === "blocked";

  // Derive the current user's paid status from app-context (source of truth
  // from monthly_payments). Admins and super_admins bypass the paid check.
  const currentUserRow = users.find((u) => u.id === user.id);
  const effectivePaid = isAdmin || (currentUserRow?.isPaid ?? false);

  const registered = isRegistered(user.id);
  const waitlisted = isWaitlisted(user.id);
  const waitPos = getWaitlistPosition(user.id);

  const canRegister =
    ready &&
    !registered &&
    !waitlisted &&
    !isBlocked &&
    effectivePaid &&
    status === "open";

  function handleToggle() {
    if (!user) return;
    if (registered || waitlisted) {
      unregisterFromGame(user.id);
    } else {
      registerForGame(user.id, user.fullName);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Session Info Card */}
      <div className="relative bg-card border border-card-border rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden animate-fade-up">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, var(--accent), var(--warning))" }} />
        <div className="text-[21px] font-extrabold tracking-[-0.3px] mb-2.5">
          {formatFullDate(gameDay.date)}
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-accent-soft border border-accent/20 px-3.5 py-1 rounded-lg text-[15px] font-bold text-accent-hover">
            7:30 PM
          </span>
          <span className="text-text-muted">—</span>
          <span className="bg-accent-soft border border-accent/20 px-3.5 py-1 rounded-lg text-[15px] font-bold text-accent-hover">
            10:00 PM
          </span>
        </div>
      </div>

      {/* Progress Block */}
      <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted">Players</span>
          <div className="text-[22px] font-extrabold">
            <span className="text-accent-hover">{filled}</span>
            <span className="text-text-muted mx-0.5">/</span>
            <span className="text-text-muted">{MAX_SLOTS}</span>
          </div>
        </div>
        <div className="w-full h-[5px] bg-card-border rounded-md overflow-hidden">
          <div
            className="h-full rounded-md animate-grow"
            style={{
              background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
              "--fill-width": `${fillPercent}%`,
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Blocked Message */}
      {isBlocked && gameDay.blockMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-destructive/5 border border-destructive/20 p-3">
          <Ban className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive text-sm">Not Available</p>
            <p className="text-sm text-muted mt-1">{gameDay.blockMessage}</p>
          </div>
        </div>
      )}

      {/* Unpaid Warning */}
      {!effectivePaid && (
        <div className="flex items-start gap-2 text-[11px] leading-snug text-warning-dark bg-warning-soft rounded-[10px] px-3 py-2 border border-warning/20">
          <CreditCard className="h-3 w-3 shrink-0 mt-0.5" />
          <span>Payment required — awaiting admin approval.</span>
        </div>
      )}

      {/* Player List */}
      <PlayerList
        players={gameDay.registeredPlayers}
        waitlist={gameDay.waitlist}
        currentUserId={user.id}
      />

      {/* Action Button (formerly in MobileNav) */}
      <div className="pt-2 animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <ActionButton
          ready={ready}
          registered={registered}
          waitlisted={waitlisted}
          waitPos={waitPos}
          effectivePaid={effectivePaid}
          isBlocked={isBlocked}
          canRegister={canRegister}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}

function ActionButton({
  ready,
  registered,
  waitlisted,
  waitPos,
  effectivePaid,
  isBlocked,
  canRegister,
  onToggle,
}: {
  ready: boolean;
  registered: boolean;
  waitlisted: boolean;
  waitPos: number;
  effectivePaid: boolean;
  isBlocked: boolean;
  canRegister: boolean;
  onToggle: () => void;
}) {
  if (!ready) {
    return (
      <div className="w-full h-[56px] rounded-[14px] bg-card-border/40 animate-pulse" />
    );
  }

  if (registered) {
    return (
      <button
        onClick={onToggle}
        className="w-full py-4 rounded-[14px] font-extrabold text-[17px] tracking-[0.3px] flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
        style={{
          background: "#FBBF24",
          color: "#111",
          boxShadow: "0 4px 20px rgba(251,191,36,0.3)",
        }}
      >
        ✓ You&apos;re In! — Tap to Cancel
      </button>
    );
  }

  if (waitlisted) {
    return (
      <button
        onClick={onToggle}
        className="w-full py-4 rounded-[14px] font-extrabold text-[17px] tracking-[0.3px] flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
        style={{
          background: "#FBBF24",
          color: "#111",
          boxShadow: "0 4px 20px rgba(251,191,36,0.3)",
        }}
      >
        Waitlisted #{waitPos} — Tap to Leave
      </button>
    );
  }

  if (isBlocked) {
    return (
      <button
        disabled
        className="w-full py-4 rounded-[14px] font-extrabold text-[17px] tracking-[0.3px] flex items-center justify-center gap-2 opacity-50 cursor-not-allowed border-0 bg-card-border text-muted"
      >
        Registration Closed
      </button>
    );
  }

  if (!effectivePaid) {
    return (
      <button
        disabled
        className="w-full py-4 rounded-[14px] font-extrabold text-[17px] tracking-[0.3px] flex items-center justify-center gap-2 opacity-50 cursor-not-allowed border-0 bg-card-border text-muted"
      >
        Wait for Admin Approval
      </button>
    );
  }

  return (
    <button
      onClick={canRegister ? onToggle : undefined}
      disabled={!canRegister}
      className="w-full py-4 rounded-[14px] font-extrabold text-[17px] tracking-[0.3px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 hover:-translate-y-px active:translate-y-0"
      style={{
        background: "var(--accent)",
        color: "#111",
        boxShadow: "0 4px 20px rgba(52,211,153,0.25)",
      }}
    >
      Register Now →
    </button>
  );
}
