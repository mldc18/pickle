"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/auth-context";
import { useApp } from "@/context/app-context";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Exact pathname match for the active state, instead of startsWith. */
  exact?: boolean;
};

/**
 * Sticky bottom bar.
 *
 * Admins always see five buttons — Play, Profile, Admin (Overview),
 * Users, Calendar — so there's no nested sidebar or secondary tab
 * row anywhere in the app. Members see the two-button Play/Profile
 * pair.
 *
 * On /dashboard the Register/Cancel/Waitlist CTA is rendered above
 * the nav row so it's always visible.
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

  const navItems: NavItem[] = isAdmin
    ? [
        { href: "/dashboard", label: "Play", icon: Trophy, exact: true },
        { href: "/profile", label: "Profile", icon: User },
        { href: "/admin", label: "Admin", icon: LayoutDashboard, exact: true },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/calendar", label: "Calendar", icon: CalendarDays },
      ]
    : [
        { href: "/dashboard", label: "Play", icon: Trophy, exact: true },
        { href: "/profile", label: "Profile", icon: User },
      ];

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

        <div className="flex items-stretch justify-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 rounded-[12px] transition-colors",
                  active
                    ? "text-accent-hover bg-accent-soft"
                    : "text-text-muted hover:text-accent-hover hover:bg-accent-soft",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                <span className="text-[11px] font-bold tracking-[0.2px] truncate w-full text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
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
