"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatShortMonth, get6MonthRange, getMonthKey } from "@/lib/utils";
import { Search, Check, Save, Download, Shield, ShieldCheck, Filter } from "lucide-react";
import { cn } from "@/lib/cn";
import { shortName } from "@/lib/utils";
import Link from "next/link";

export default function AdminUsersPage() {
  const { users, togglePayment } = useApp();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "member" | "admin" | "super_admin">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [noShowFilter, setNoShowFilter] = useState<"all" | "has_noshows" | "clean">("all");
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, boolean>>>({});
  const [saved, setSaved] = useState(false);

  const months = get6MonthRange();
  const currentMonth = getMonthKey(new Date());

  const filtered = users.filter((u) => {
    if (!u.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (paymentFilter === "paid" && !u.isPaid) return false;
    if (paymentFilter === "unpaid" && u.isPaid) return false;
    if (noShowFilter === "has_noshows" && u.noShowCount === 0) return false;
    if (noShowFilter === "clean" && u.noShowCount > 0) return false;
    return true;
  });

  function getStatus(userId: string, month: string): boolean {
    if (pendingChanges[userId]?.[month] !== undefined) {
      return pendingChanges[userId][month];
    }
    const user = users.find((u) => u.id === userId);
    return user?.paymentHistory.find((p) => p.month === month)?.paid ?? false;
  }

  function handleToggle(userId: string, month: string) {
    const current = getStatus(userId, month);
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [month]: !current },
    }));
    setSaved(false);
  }

  function handleSave() {
    for (const userId of Object.keys(pendingChanges)) {
      for (const month of Object.keys(pendingChanges[userId])) {
        const user = users.find((u) => u.id === userId);
        const currentPaid = user?.paymentHistory.find((p) => p.month === month)?.paid ?? false;
        const newPaid = pendingChanges[userId][month];
        if (currentPaid !== newPaid) {
          togglePayment(userId, month);
        }
      }
    }
    setPendingChanges({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const hasChanges = Object.keys(pendingChanges).length > 0;

  function handleExportCSV() {
    const headers = ["Full Name", "Email", "Mobile", "Address", "Emergency Contact", "Emergency Contact Number", "Role", "Status", "Member Since", "La Marea ID URL"];
    const rows = users
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
      .map((u) => [
        u.fullName,
        u.email,
        u.mobile,
        u.address,
        u.emergencyContactName || "",
        u.emergencyContactNumber || "",
        u.role,
        u.isPaid ? "Active" : "Inactive",
        u.createdAt,
        u.laMareaIdUrl || "",
      ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lampa-users-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="text-[21px] font-extrabold tracking-[-0.3px]">Users & Status</h1>
        <Button size="sm" variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="relative animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          className="pl-9"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 animate-fade-up" style={{ animationDelay: "0.07s" }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted w-12 shrink-0">Role</span>
          {(["all", "member", "admin", "super_admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors",
                roleFilter === r
                  ? "bg-accent-soft text-accent-hover border-accent/30"
                  : "bg-card text-muted border-card-border hover:border-accent/20"
              )}
            >
              {r === "admin" && <Shield className="h-2.5 w-2.5" />}
              {r === "super_admin" && <ShieldCheck className="h-2.5 w-2.5" />}
              {r === "all" ? "All" : r === "super_admin" ? "Super Admin" : r === "admin" ? "Admin" : "Member"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted w-12 shrink-0">Status</span>
          {(["all", "paid", "unpaid"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setPaymentFilter(s)}
              className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors",
                paymentFilter === s
                  ? "bg-accent-soft text-accent-hover border-accent/30"
                  : "bg-card text-muted border-card-border hover:border-accent/20"
              )}
            >
              {s === "all" ? "All" : s === "paid" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted w-12 shrink-0">Shows</span>
          {(["all", "has_noshows", "clean"] as const).map((n) => (
            <button
              key={n}
              onClick={() => setNoShowFilter(n)}
              className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors",
                noShowFilter === n
                  ? "bg-accent-soft text-accent-hover border-accent/30"
                  : "bg-card text-muted border-card-border hover:border-accent/20"
              )}
            >
              {n === "all" ? "All" : n === "has_noshows" ? "Has No-Shows" : "Clean"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[16px] border border-card-border bg-card shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-0 overflow-hidden animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card">
                <th className="sticky left-0 z-10 bg-card px-2.5 py-2.5 text-left text-[11px] font-bold tracking-[1px] uppercase text-muted whitespace-nowrap">
                  Name
                </th>
                {months.map((m) => (
                  <th key={m} className={cn(
                    "px-2 py-2.5 text-center whitespace-nowrap text-[11px] font-bold tracking-[1px] uppercase",
                    m === currentMonth ? "text-accent-hover" : "text-muted"
                  )}>
                    {formatShortMonth(m)}
                    {m === currentMonth && <span className="block text-[8px] font-bold text-accent-hover">now</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map((user) => (
                  <tr key={user.id} className="border-b border-card-border/50 hover:bg-accent-soft/30 transition-colors">
                    <td className="sticky left-0 z-10 bg-card px-2.5 py-2.5 whitespace-nowrap max-w-[120px]">
                      <Link href={`/admin/users/${user.id}`} className="hover:text-accent-hover transition-colors text-[11px] font-bold truncate flex items-center gap-1">
                        {shortName(user.firstName, user.lastName)}
                        {user.role === "super_admin" && <ShieldCheck className="h-2.5 w-2.5 text-warning-dark shrink-0" />}
                        {user.role === "admin" && <Shield className="h-2.5 w-2.5 text-warning-dark shrink-0" />}
                      </Link>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant={user.isPaid ? "success" : "destructive"} className="text-[8px]">
                          {user.isPaid ? "Active" : "Inactive"}
                        </Badge>
                        {user.noShowCount > 0 && (
                          <Badge variant="warning" className="text-[8px]">
                            {user.noShowCount} NS
                          </Badge>
                        )}
                      </div>
                    </td>
                    {months.map((m) => {
                      const active = getStatus(user.id, m);
                      const hasPending = pendingChanges[user.id]?.[m] !== undefined;
                      const isFuture = m > currentMonth;
                      return (
                        <td key={m} className="px-2 py-2.5 text-center">
                          <button
                            onClick={() => !isFuture && handleToggle(user.id, m)}
                            disabled={isFuture}
                            className={cn(
                              "h-7 w-7 rounded-[8px] flex items-center justify-center transition-all",
                              isFuture
                                ? "bg-card-border/10 text-card-border/30 cursor-not-allowed"
                                : active
                                  ? "bg-accent-soft text-accent-hover hover:bg-accent/20"
                                  : "bg-card-border/20 text-card-border hover:bg-card-border/40",
                              hasPending && "ring-2 ring-warning/50"
                            )}
                          >
                            {active ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">·</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spacer so sticky bar doesn't overlap content */}
      {hasChanges && <div className="h-16" />}

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="fixed bottom-[72px] left-0 right-0 z-30 px-4 pb-3 animate-fade-up">
          <div className="max-w-lg mx-auto flex items-center gap-3 rounded-[14px] bg-card border border-card-border shadow-[0_4px_20px_rgba(0,0,0,0.12)] px-4 py-3">
            <p className="flex-1 text-[12px] font-semibold text-warning-dark">
              You have unsaved changes
            </p>
            <Button size="sm" variant="outline" onClick={() => { setPendingChanges({}); }}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Saved toast */}
      {saved && (
        <div className="fixed bottom-[72px] left-0 right-0 z-30 px-4 pb-3 animate-fade-up">
          <div className="max-w-lg mx-auto flex items-center justify-center gap-2 rounded-[14px] bg-accent-soft border border-accent/20 shadow-[0_4px_20px_rgba(0,0,0,0.12)] px-4 py-3">
            <Check className="h-4 w-4 text-accent-hover" />
            <p className="text-[12px] font-bold text-accent-hover">Changes saved</p>
          </div>
        </div>
      )}
    </div>
  );
}
