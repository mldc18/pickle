"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Trophy, Clock, ChevronLeft, ChevronRight, UserPlus, UserCheck, Eye, CheckCircle } from "lucide-react";
import { getMonthKey } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { users, gameDay, togglePayment } = useApp();
  const { isSuperAdmin } = useAuth();
  const [monthOffset, setMonthOffset] = useState(0);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const viewDate = new Date();
  viewDate.setMonth(viewDate.getMonth() - monthOffset);
  const viewMonthKey = getMonthKey(viewDate);
  const viewMonthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isCurrentMonth = monthOffset === 0;
  const currentMonth = getMonthKey(new Date());

  // Users who have a payment screenshot but are not yet active (not paid for current month)
  const pendingVerification = users.filter(
    (u) => u.paymentScreenshotUrl && !u.paymentHistory.some((p) => p.month === currentMonth && p.paid) && u.role === "member"
  );

  async function handleActivate(userId: string) {
    setActivatingId(userId);
    await togglePayment(userId, currentMonth);
    setActivatingId(null);
  }

  const paidThisMonth = users.filter((u) =>
    u.paymentHistory.some((p) => p.month === viewMonthKey && p.paid)
  ).length;
  const unpaidThisMonth = users.length - paidThisMonth;

  const todayStats = [
    { label: "Playing", value: gameDay.registeredPlayers.length, icon: Trophy, color: "text-accent-hover bg-accent-soft" },
    { label: "Waitlisted", value: gameDay.waitlist.length, icon: Clock, color: "text-warning-dark bg-warning-soft" },
  ];

  const registeredThisMonth = users.filter((u) => {
    const created = u.createdAt.substring(0, 7);
    return created === viewMonthKey;
  }).length;

  const monthStats = [
    { label: "Active", value: paidThisMonth, icon: CreditCard, color: "text-accent-hover bg-accent-soft" },
    { label: "Inactive", value: unpaidThisMonth, icon: CreditCard, color: "text-destructive bg-destructive/10" },
    { label: "Registered", value: registeredThisMonth, icon: UserPlus, color: "text-accent-hover bg-accent-soft" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[21px] font-extrabold tracking-[-0.3px] animate-fade-up">Admin Dashboard</h1>

      {/* Today */}
      <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted mb-3 block">Today</span>
        <div className="grid grid-cols-2 gap-3">
          {todayStats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-[16px] border border-card-border bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${s.color} shadow-[0_2px_8px_rgba(0,0,0,0.08)]`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[22px] font-extrabold">{s.value}</span>
                  <span className="text-[11px] font-semibold text-muted">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly */}
      <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted">Monthly</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonthOffset(monthOffset + 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] font-bold min-w-[100px] text-center">{viewMonthLabel}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))} disabled={isCurrentMonth}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {monthStats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-[16px] border border-card-border bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-[13px] ${s.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xl font-extrabold">{s.value}</span>
                  <span className="text-[10px] font-semibold text-muted text-center">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Verification — super admins only */}
      {isSuperAdmin && pendingVerification.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted mb-3 block">Pending Verification</span>
          <div className="flex flex-col gap-2">
            {pendingVerification.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-[12px] border border-card-border bg-card px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-soft text-accent-hover text-sm font-extrabold overflow-hidden shrink-0">
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <>{u.firstName[0]}{u.lastName[0]}</>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate">{u.fullName}</p>
                  <p className="text-[10px] text-text-muted font-medium">Registered {u.createdAt}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="inline-flex items-center gap-1 rounded-[8px] border border-card-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-muted hover:text-foreground hover:border-accent transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    Details
                  </Link>
                  <Button
                    size="sm"
                    className="h-7 text-[11px] px-2.5"
                    disabled={activatingId === u.id}
                    onClick={() => handleActivate(u.id)}
                  >
                    <CheckCircle className="h-3 w-3" />
                    {activatingId === u.id ? "..." : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted mb-3 block">Total</span>
        <div className="rounded-[16px] border border-card-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] text-accent-hover bg-accent-soft shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[22px] font-extrabold">{users.length}</span>
              <p className="text-[11px] font-semibold text-muted">Members signed up</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
