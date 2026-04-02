"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatShortMonth, getLast12Months } from "@/lib/utils";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import Link from "next/link";

export default function AdminUsersPage() {
  const { users, togglePayment } = useApp();
  const [search, setSearch] = useState("");
  const months = getLast12Months();

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Users & Payments</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <Input
          className="pl-9"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card">
                <th className="sticky left-0 z-10 bg-card px-2 py-2 text-left font-medium text-muted whitespace-nowrap text-xs">
                  Name
                </th>
                {months.map((m) => (
                  <th key={m} className="px-2 py-3 text-center font-medium text-muted whitespace-nowrap text-xs">
                    {formatShortMonth(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map((user) => (
                  <tr key={user.id} className="border-b border-card-border/50 hover:bg-card-border/10 transition-colors">
                    <td className="sticky left-0 z-10 bg-card px-2 py-2 whitespace-nowrap max-w-[120px]">
                      <Link href={`/admin/users/${user.id}`} className="hover:text-accent transition-colors text-xs font-medium truncate block">
                        {user.firstName} {user.lastName[0]}.
                      </Link>
                      <Badge variant={user.isPaid ? "success" : "destructive"} className="text-[8px] mt-0.5">
                        {user.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </td>
                    {months.map((m) => {
                      const payment = user.paymentHistory.find((p) => p.month === m);
                      const paid = payment?.paid ?? false;
                      return (
                        <td key={m} className="px-2 py-3 text-center">
                          <button
                            onClick={() => togglePayment(user.id, m)}
                            className={cn(
                              "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                              paid
                                ? "bg-success/15 text-success hover:bg-success/25"
                                : "bg-card-border/20 text-card-border hover:bg-card-border/40"
                            )}
                          >
                            {paid ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">·</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
