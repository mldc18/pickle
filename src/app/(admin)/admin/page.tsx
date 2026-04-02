"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Trophy, Clock, ChevronLeft, ChevronRight, UserPlus, UserCheck } from "lucide-react";
import { getMonthKey } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { users, gameDay } = useApp();
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = new Date();
  viewDate.setMonth(viewDate.getMonth() - monthOffset);
  const viewMonthKey = getMonthKey(viewDate);
  const viewMonthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isCurrentMonth = monthOffset === 0;

  const paidThisMonth = users.filter((u) =>
    u.paymentHistory.some((p) => p.month === viewMonthKey && p.paid)
  ).length;
  const unpaidThisMonth = users.length - paidThisMonth;

  const todayStats = [
    { label: "Playing", value: gameDay.registeredPlayers.length, icon: Trophy, color: "text-accent bg-accent/10" },
    { label: "Waitlisted", value: gameDay.waitlist.length, icon: Clock, color: "text-warning bg-warning/10" },
  ];

  const registeredThisMonth = users.filter((u) => {
    const created = u.createdAt.substring(0, 7); // "2025-07"
    return created === viewMonthKey;
  }).length;

  const monthStats = [
    { label: "Paid", value: paidThisMonth, icon: CreditCard, color: "text-success bg-success/10" },
    { label: "Unpaid", value: unpaidThisMonth, icon: CreditCard, color: "text-destructive bg-destructive/10" },
    { label: "Registered", value: registeredThisMonth, icon: UserPlus, color: "text-accent bg-accent/10" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>

      {/* Today */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Today</h2>
        <div className="grid grid-cols-2 gap-3">
          {todayStats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-bold">{s.value}</span>
                    <span className="text-xs text-muted">{s.label}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Monthly */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Monthly</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonthOffset(monthOffset + 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium min-w-[100px] text-center">{viewMonthLabel}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))} disabled={isCurrentMonth}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {monthStats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xl font-bold">{s.value}</span>
                    <span className="text-[10px] text-muted text-center">{s.label}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Total */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Total</h2>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-accent bg-accent/10">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-2xl font-bold">{users.length}</span>
                <p className="text-xs text-muted">Members signed up</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
