"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useApp } from "@/context/app-context";

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const {
    registerForGame,
    unregisterFromGame,
    isRegistered,
    isWaitlisted,
    getWaitlistPosition,
    getRegistrationStatus,
    users,
  } = useApp();

  const showCTA = pathname === "/dashboard" && !!user;
  if (!showCTA) return null;

  const status = getRegistrationStatus();
  const registered = isRegistered(user!.id);
  const waitlisted = isWaitlisted(user!.id);
  const waitPos = getWaitlistPosition(user!.id);
  // Current user's paid status comes from app-context (monthly_payments).
  // Admins and super_admins bypass the paid check entirely.
  const currentUserRow = users.find((u) => u.id === user!.id);
  const effectivePaid = isAdmin || (currentUserRow?.isPaid ?? false);
  const canRegister = status === "open" && effectivePaid;

  function handleToggle() {
    if (!user) return;
    if (registered || waitlisted) {
      unregisterFromGame(user.id);
    } else {
      registerForGame(user.id, user.fullName);
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-card-border pb-[max(8px,env(safe-area-inset-bottom))] sm:hidden">
      <div className="px-5 py-3 max-w-[460px] mx-auto">
        {registered ? (
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
        ) : waitlisted ? (
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
        ) : !effectivePaid ? (
          <button
            disabled
            className="w-full py-4 rounded-[14px] font-extrabold text-[17px] tracking-[0.3px] flex items-center justify-center gap-2 opacity-50 cursor-not-allowed border-0 bg-card-border text-muted"
          >
            Wait for Admin Approval
          </button>
        ) : status === "closed" ? (
          <button
            disabled
            className="w-full py-4 rounded-[14px] font-extrabold text-[17px] tracking-[0.3px] flex items-center justify-center gap-2 opacity-50 cursor-not-allowed border-0 bg-card-border text-muted"
          >
            Registration Closed
          </button>
        ) : (
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
        )}
      </div>
    </nav>
  );
}
