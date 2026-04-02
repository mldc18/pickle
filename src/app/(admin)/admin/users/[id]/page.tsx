"use client";

import { use } from "react";
import { useApp } from "@/context/app-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Shield, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { users, incrementNoShow } = useApp();
  const user = users.find((u) => u.id === id);

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted">User not found.</p>
          <Link href="/admin/users" className="text-sm text-accent hover:underline mt-2 block">
            Back to users
          </Link>
        </CardContent>
      </Card>
    );
  }

  const fields = [
    { label: "Username", value: user.username, icon: User },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Mobile", value: user.mobile, icon: Phone },
    { label: "Address", value: user.address, icon: MapPin },
    { label: "Member Since", value: user.createdAt, icon: Calendar },
    { label: "Role", value: user.role, icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-accent hover:underline w-fit">
        <ArrowLeft className="h-3 w-3" />
        Back to users
      </Link>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent text-xl font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
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
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <p className="text-xs text-muted">{f.label}</p>
                    <p className="text-sm">{f.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* No-Shows */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">No-Shows</CardTitle>
                <span className="text-3xl font-bold">{user.noShowCount}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => incrementNoShow(user.id)}>
              <Plus className="h-4 w-4" />
              Add No-Show
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
