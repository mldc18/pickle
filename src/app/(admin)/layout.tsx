"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { AppProvider } from "@/context/app-context";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LayoutDashboard, Users } from "lucide-react";

function AdminSidebar() {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users & Payments" },
  ];

  return (
    <nav className="hidden sm:flex flex-col gap-1 w-48 shrink-0">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-accent/10 text-accent font-medium" : "text-muted hover:text-foreground hover:bg-card"
            )}
          >
            {link.label}
          </Link>
        );
      })}
      <Link
        href="/dashboard"
        className="mt-4 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-card"
      >
        Back to App
      </Link>
    </nav>
  );
}

function AdminMobileTabs() {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <div className="flex gap-1 sm:hidden overflow-x-auto pb-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
              active ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground hover:bg-card-border/30"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    else if (!isAdmin) router.push("/dashboard");
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <AppProvider>
      <Header />
      <div className="mx-auto flex w-full max-w-4xl flex-1 gap-6 px-4 py-6 pb-20 sm:pb-6">
        <AdminSidebar />
        <main className="flex-1 min-w-0">
          <AdminMobileTabs />
          {children}
        </main>
      </div>
      <MobileNav />
    </AppProvider>
  );
}
