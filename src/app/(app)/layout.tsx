"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { AppProvider } from "@/context/app-context";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <AppProvider>
      <Header />
      <main className="mx-auto w-full max-w-[480px] flex-1 px-5 pt-2 pb-28 sm:pb-6">
        {children}
      </main>
      <MobileNav />
    </AppProvider>
  );
}
