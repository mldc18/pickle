"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Trophy, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function Header() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const onProfile = pathname.startsWith("/profile");
  const onAdmin = pathname.startsWith("/admin");
  const target = onProfile || onAdmin ? "/dashboard" : "/profile";
  const Icon = onProfile || onAdmin ? Trophy : User;
  const label = onProfile || onAdmin ? "Play" : "Profile";

  return (
    <header className="w-full">
      <div className="mx-auto flex h-12 max-w-[460px] items-center justify-between px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lampa-logo.jpg"
            alt="LAMPA"
            className="h-9 w-9 rounded-full object-cover"
          />
          <span className="text-[22px] font-extrabold text-accent-hover tracking-[-0.5px]">
            LAMPA
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {isAdmin && !onAdmin && (
            <Link
              href="/admin"
              aria-label="Admin"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-text-muted hover:text-accent-hover hover:bg-accent-soft transition-colors"
            >
              <Shield className="h-[18px] w-[18px]" strokeWidth={2} />
            </Link>
          )}
          <Link
            href={target}
            aria-label={label}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-text-muted hover:text-accent-hover hover:bg-accent-soft transition-colors"
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  );
}
