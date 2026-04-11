"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { AppProvider } from "@/context/app-context";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    else if (!isAdmin) router.push("/dashboard");
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) return null;

  // All admin sub-navigation lives in the sticky bottom bar
  // (MobileNav) — no nested sidebar or secondary tab row.
  return (
    <AppProvider>
      <Header />
      <main className="mx-auto w-full max-w-[480px] flex-1 px-5 pt-2 pb-28">
        {children}
      </main>
      <MobileNav />
    </AppProvider>
  );
}
