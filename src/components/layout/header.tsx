"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";

export function Header() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-bold text-accent tracking-wider">
          LAMPA
        </Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin" className="hidden sm:flex items-center gap-1 text-xs text-warning hover:underline">
              <Shield className="h-3 w-3" />
              Admin
            </Link>
          )}
          <span className="text-xs text-muted hidden sm:block">{user?.firstName}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
