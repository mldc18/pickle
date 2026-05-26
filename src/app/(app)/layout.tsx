"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { AppProvider } from "@/context/app-context";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isChangePasswordRoute = pathname === "/change-password";

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.mustChangePassword && !isChangePasswordRoute) {
      router.replace("/change-password");
      return;
    }
  }, [isAuthenticated, isChangePasswordRoute, router, user]);

  if (!isAuthenticated) return null;
  if (user?.mustChangePassword && !isChangePasswordRoute) return null;

  if (isChangePasswordRoute) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[480px] items-center px-5 py-8">
        {children}
      </main>
    );
  }

  return (
    <AppProvider>
      <Header />
      <main className="mx-auto w-full max-w-[480px] flex-1 px-5 pt-2 pb-[180px]">
        {children}
      </main>
      <MobileNav />
    </AppProvider>
  );
}
