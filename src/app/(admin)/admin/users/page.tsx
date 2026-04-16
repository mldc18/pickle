"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatShortMonth, get6MonthRange, getMonthKey } from "@/lib/utils";
import { Search, Check, Save, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import Link from "next/link";

export default function AdminUsersPage() {
  const { users, togglePayment } = useApp();
  const [search, setSearch] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, boolean>>>({});
  const [saved, setSaved] = useState(false);

  const months = get6MonthRange();
  const currentMonth = getMonthKey(new Date());

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          {hasChanges && (
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save
            </Button>
          )}
          {saved && (
            <span className="text-[11px] text-accent-hover font-bold">Saved</span>
          )}
        </div>
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
                      <Link href={`/admin/users/${user.id}`} className="hover:text-accent-hover transition-colors text-[11px] font-bold truncate block">
                        {user.firstName} {user.lastName[0]}.
                      </Link>
                      <Badge variant={user.isPaid ? "success" : "destructive"} className="text-[8px] mt-0.5">
                        {user.isPaid ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    {months.map((m) => {
                      const active = getStatus(user.id, m);
                      const hasPending = pendingChanges[user.id]?.[m] !== undefined;
                      return (
                        <td key={m} className="px-2 py-2.5 text-center">
                          <button
                            onClick={() => handleToggle(user.id, m)}
                            className={cn(
                              "h-7 w-7 rounded-[8px] flex items-center justify-center transition-all",
                              active
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

      {hasChanges && (
        <p className="text-[11px] text-warning-dark font-bold text-center">
          You have unsaved changes. Click Save to apply.
        </p>
      )}
    </div>
  );
}
