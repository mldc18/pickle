"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Upload } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);

  if (!user) return null;

  const fields = [
    { label: "Full Name", value: user.fullName, icon: User },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Mobile", value: user.mobile, icon: Phone },
    { label: "Address", value: user.address, icon: MapPin },
    { label: "Member Since", value: user.createdAt, icon: Calendar },
  ];

  // Group payment history by year
  const historyByYear: Record<string, { month: string; monthName: string; paid: boolean }[]> = {};
  for (const entry of user.paymentHistory) {
    const [year, monthNum] = entry.month.split("-");
    const date = new Date(Number(year), Number(monthNum) - 1);
    const monthName = date.toLocaleDateString("en-US", { month: "long" });
    if (!historyByYear[year]) historyByYear[year] = [];
    historyByYear[year].push({ month: entry.month, monthName, paid: entry.paid });
  }
  const sortedYears = Object.keys(historyByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex flex-col gap-4">
      {/* Profile Header - Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent text-xl font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1">
              <CardTitle>{user.fullName}</CardTitle>
              <p className="text-sm text-muted">@{user.username}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={user.isPaid ? "success" : "destructive"}>
                  {user.isPaid ? "Paid" : "Unpaid"}
                </Badge>
                {user.role === "admin" && <Badge variant="warning">Admin</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details - no card */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Details</h3>
        <div className="flex flex-col gap-3">
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted">{f.label}</p>
                  <p className="text-sm truncate">{f.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Payment History - no card */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold">Payment History</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4" />
            Submit Proof
          </Button>
        </div>

        {showUpload && (
          <div className="mb-4">
            <FileUpload label="Upload payment proof for this month" onChange={() => {}} />
            <p className="text-xs text-muted mt-2">Admin will review and approve your payment.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {sortedYears.map((year) => (
            <div key={year}>
              <h4 className="text-sm font-semibold text-muted mb-2">{year}</h4>
              <div className="flex flex-col gap-1">
                {historyByYear[year].map((entry) => (
                  <div
                    key={entry.month}
                    className="flex items-center justify-between rounded-lg bg-card border border-card-border px-3 py-2"
                  >
                    <span className="text-sm">{entry.monthName}</span>
                    <Badge variant={entry.paid ? "success" : "destructive"} className="text-[10px]">
                      {entry.paid ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
