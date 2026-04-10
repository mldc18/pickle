"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, User } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/profile");
  const target = onProfile ? "/dashboard" : "/profile";
  const Icon = onProfile ? Trophy : User;
  const label = onProfile ? "Play" : "Profile";

  return (
    <header className="w-full">
      <div className="mx-auto flex h-12 max-w-[460px] items-center justify-between px-5">
        <Link href="/dashboard" className="text-[22px] font-extrabold text-accent-hover tracking-[-0.5px]">
          LAMPA
        </Link>
        <Link
          href={target}
          aria-label={label}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-text-muted hover:text-accent-hover hover:bg-accent-soft transition-colors"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
