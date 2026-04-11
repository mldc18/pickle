"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Trophy, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useApp } from "@/context/app-context";

/**
 * Sticky bottom bar.
 *
 * Always shows the nav icon row (Play/Profile toggle + Admin shield for
 * admins). On /dashboard it also shows the Register/Cancel/Waitlist
 * action button above the nav row so the CTA is always visible to the
 * user without scrolling to the bottom of the player list.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const {
    ready,
    registerForGame,
    unregisterFromGame,
    isRegistered,
    isWaitlisted,
    getWaitlistPosition,
    getRegistrationStatus,
    users,
  } = useApp();

  if (!user) return null;

  const onProfile = pathname.startsWith("/profile");
  const onAdmin = pathname.startsWith("/admin");
  const toggleTarget = onProfile || onAdmin ? "/dashboard" : "/profile";
  const ToggleIcon = onProfile || onAdmin ? Trophy : User;
  const toggleLabel = onProfile || onAdmin ? "Play" : "Profile";

  const showAction = pathname === "/dashboard";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-card-border pb-[max(8px,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-[460px] flex-col gap-2 px-5 pt-3">
        {showAction && (
          <>
            <RegistrationAction
              ready={ready}
              userId={user.id}
              userFullName={user.fullName}
              isAdmin={isAdmin}
              users={users}
              registerForGame={registerForGame}
              unregisterFromGame={unregisterFromGame}
              isRegistered={isRegistered}
              isWaitlisted={isWaitlisted}
              getWaitlistPosition={getWaitlistPosition}
              getRegistrationStatus={getRegistrationStatus}
            />
            <div className="h-px bg-card-border mx-1" />
          </>
        )}

        <div className="flex items-stretch justify-center gap-2">
          <Link
            href={toggleTarget}
            aria-label={toggleLabel}
            className="flex flex-1 min-w-[92px] flex-col items-center justify-center gap-1 py-2 rounded-[12px] text-text-muted hover:text-accent-hover hover:bg-accent-soft transition-colors"
          >
            <ToggleIcon className="h-5 w-5" strokeWidth={2} />
            <span className="text-[12px] font-bold tracking-[0.2px]">
              {toggleLabel}
            </span>
          </Link>
          {isAdmin && !onAdmin && (
            <Link
              href="/admin"
              aria-label="Admin"
              className="flex flex-1 min-w-[92px] flex-col items-center justify-center gap-1 py-2 rounded-[12px] text-text-muted hover:text-accent-hover hover:bg-accent-soft transition-colors"
            >
              <Shield className="h-5 w-5" strokeWidth={2} />
              <span className="text-[12px] font-bold tracking-[0.2px]">
                Admin
              </span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Registration action button (dashboard only)
// ---------------------------------------------------------------------------

type AppContextLike = ReturnType<typeof useApp>;

function RegistrationAction({
  ready,
  userId,
  userFullName,
  isAdmin,
  users,
  registerForGame,
  unregisterFromGame,
  isRegistered,
  isWaitlisted,
  getWaitlistPosition,
  getRegistrationStatus,
}: {
  ready: boolean;
  userId: string;
  userFullName: string;
  isAdmin: boolean;
  users: AppContextLike["users"];
  registerForGame: AppContextLike["registerForGame"];
  unregisterFromGame: AppContextLike["unregisterFromGame"];
  isRegistered: AppContextLike["isRegistered"];
  isWaitlisted: AppContextLike["isWaitlisted"];
  getWaitlistPosition: AppContextLike["getWaitlistPosition"];
  getRegistrationStatus: AppContextLike["getRegistrationStatus"];
}) {
  if (!ready) {
    return (
      <div className="w-full h-[56px] rounded-[14px] bg-card-border/40 animate-pulse" />
    );
  }

  const status = getRegistrationStatus();
  const registered = isRegistered(userId);
  const waitlisted = isWaitlisted(userId);
  const waitPos = getWaitlistPosition(userId);

  // Admins and super_admins bypass the paid check via app-context row.
  const currentUserRow = users.find((u) => u.id === userId);
  const effectivePaid = isAdmin || (currentUserRow?.isPaid ?? false);
  const isBlocked = status === "blocked";

  const canRegister =
    !registered && !waitlisted && !isBlocked && effectivePaid;

  function handleToggle() {
    if (registered || waitlisted) {
      unregisterFromGame(userId);
    } else {
      registerForGame(userId, userFullName);
    }
  }

  if (registered) {
    return (
      <button
        onClick={handleToggle}
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
        onClick={handleToggle}
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
      onClick={canRegister ? handleToggle : undefined}
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
