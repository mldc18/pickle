"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Trophy, User, Settings, CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";

export function MobileNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const items = [
    { href: "/dashboard", label: "Play", icon: Trophy },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Settings }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-card-border bg-background/95 backdrop-blur-md sm:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors",
                active ? "text-accent" : "text-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
