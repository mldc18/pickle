"use client";

import { use } from "react";
import { useApp } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Shield, ShieldOff, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { users, incrementNoShow, toggleAdmin } = useApp();
  const { isSuperAdmin } = useAuth();
  const user = users.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="rounded-[16px] border border-card-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <p className="text-muted font-medium">User not found.</p>
        <Link href="/admin/users" className="text-[11px] text-accent-hover font-bold hover:underline mt-2 block">
          Back to users
        </Link>
      </div>
    );
  }

  const fields = [
    { label: "Username", value: user.username, icon: User },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Mobile", value: user.mobile, icon: Phone },
    { label: "Address", value: user.address, icon: MapPin },
    { label: "Member Since", value: user.createdAt, icon: Calendar },
  ];

  const isUserAdmin = user.role === "admin" || user.role === "super_admin";
  const isUserSuperAdmin = user.role === "super_admin";

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-[11px] text-accent-hover font-bold hover:underline w-fit animate-fade-up">
        <ArrowLeft className="h-3 w-3" />
        Back to users
      </Link>

      {/* Header */}
      <div className="relative rounded-[16px] border border-card-border bg-card shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, var(--accent), var(--warning))" }} />
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[13px] bg-accent-soft text-accent-hover text-xl font-extrabold shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <>{user.firstName[0]}{user.lastName[0]}</>
              )}
            </div>
            <div>
              <p className="text-[17px] font-extrabold tracking-[-0.3px]">{user.fullName}</p>
              <p className="text-[11px] text-text-muted font-medium">@{user.username}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={user.isPaid ? "success" : "destructive"}>
                  {user.isPaid ? "Active" : "Inactive"}
                </Badge>
                {isUserSuperAdmin ? (
                  <Badge variant="warning">Super Admin</Badge>
                ) : isUserAdmin ? (
                  <Badge variant="warning">Admin</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-card-border px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent-soft text-accent-hover">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-[1px]">{f.label}</p>
                    <p className="text-sm font-semibold">{f.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Role */}
      <div className="rounded-[16px] border border-card-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${isUserAdmin ? "bg-warning-soft text-warning-dark" : "bg-card-border/30 text-muted"}`}>
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold">Admin Access</p>
              <p className="text-[11px] text-text-muted font-medium">{isUserAdmin ? "This user is an admin" : "Regular member"}</p>
            </div>
          </div>
          {isSuperAdmin && !isUserSuperAdmin && (
            <Button
              variant={isUserAdmin ? "destructive" : "default"}
              size="sm"
              onClick={() => toggleAdmin(user.id)}
            >
              {isUserAdmin ? (
                <><ShieldOff className="h-4 w-4" /> Remove Admin</>
              ) : (
                <><Shield className="h-4 w-4" /> Make Admin</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* No-Shows */}
      <div className="rounded-[16px] border border-card-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-warning-soft text-warning-dark shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold">No-Shows</p>
              <span className="text-[22px] font-extrabold">{user.noShowCount}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => incrementNoShow(user.id)}>
            <Plus className="h-4 w-4" />
            Add No-Show
          </Button>
        </div>
      </div>
    </div>
  );
}
