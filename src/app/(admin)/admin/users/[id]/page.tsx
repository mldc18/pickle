"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Shield, ShieldOff, ShieldCheck, AlertTriangle, ShieldAlert, IdCard, Receipt, Trash2 } from "lucide-react";
import Link from "next/link";

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { users, gameDays, toggleNoShow, toggleAdmin, toggleSuperAdmin, deleteUser } = useApp();
  const { user: currentUser, isAdmin, isSuperAdmin } = useAuth();
  const user = users.find((u) => u.id === id);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  // Build list of game dates this user registered for, with no-show status
  const registeredGameDates = Object.entries(gameDays)
    .filter(([, gd]) =>
      gd.registeredPlayers.some((p) => p.userId === user.id) ||
      gd.waitlist.some((p) => p.userId === user.id)
    )
    .map(([date, gd]) => ({
      date,
      isNoShow: gd.noShows.includes(user.id),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const fields = [
    { label: "Username", value: user.username, icon: User },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Mobile", value: user.mobile, icon: Phone },
    { label: "Address", value: user.address, icon: MapPin },
    { label: "Emergency Contact", value: user.emergencyContactName || "Not set", icon: ShieldAlert },
    { label: "Emergency Number", value: user.emergencyContactNumber || "Not set", icon: Phone },
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

      {/* Payment Screenshot & La Marea ID — visible to all admins */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-up" style={{ animationDelay: "0.07s" }}>
          <div className="rounded-[16px] border border-card-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent-soft text-accent-hover">
                <Receipt className="h-3.5 w-3.5" />
              </div>
              <p className="text-[15px] font-bold">Initial Payment Proof</p>
              <p className="text-[10px] text-text-muted font-medium">Joined {new Date(user.createdAt + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
            {user.paymentScreenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.paymentScreenshotUrl}
                alt="Payment screenshot"
                className="w-full max-h-64 object-contain rounded-[8px] border border-card-border"
              />
            ) : (
              <p className="text-sm text-muted">Not uploaded</p>
            )}
          </div>
          <div className="rounded-[16px] border border-card-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent-soft text-accent-hover">
                <IdCard className="h-3.5 w-3.5" />
              </div>
              <p className="text-[15px] font-bold">La Marea ID</p>
            </div>
            {user.laMareaIdUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.laMareaIdUrl}
                alt="La Marea ID"
                className="w-full max-h-64 object-contain rounded-[8px] border border-card-border"
              />
            ) : (
              <p className="text-sm text-muted">Not uploaded</p>
            )}
          </div>
        </div>
      )}

      {/* Admin Role */}
      <div className="rounded-[16px] border border-card-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${isUserAdmin ? "bg-warning-soft text-warning-dark" : "bg-card-border/30 text-muted"}`}>
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
              className="w-full"
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

      {/* Super Admin Role */}
      {isSuperAdmin && currentUser?.id !== user.id && (
        <div className="rounded-[16px] border border-card-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-fade-up" style={{ animationDelay: "0.12s" }}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${isUserSuperAdmin ? "bg-warning-soft text-warning-dark" : "bg-card-border/30 text-muted"}`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold">Super Admin Access</p>
                <p className="text-[11px] text-text-muted font-medium">
                  {isUserSuperAdmin
                    ? "Can promote and demote other admins"
                    : "Grants full admin promotion rights"}
                </p>
              </div>
            </div>
            <Button
              variant={isUserSuperAdmin ? "destructive" : "default"}
              size="sm"
              className="w-full"
              onClick={() => toggleSuperAdmin(user.id)}
            >
              {isUserSuperAdmin ? (
                <><ShieldOff className="h-4 w-4" /> Demote to Admin</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Make Super Admin</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* No-Shows & Game History */}
      <div className="rounded-[16px] border border-card-border bg-card p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-warning-soft text-warning-dark shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold">Game Attendance</p>
              <p className="text-[11px] text-text-muted font-medium">
                {registeredGameDates.length} game{registeredGameDates.length !== 1 ? "s" : ""} registered
                {user.noShowCount > 0 && <span className="text-warning-dark"> &middot; {user.noShowCount} no-show{user.noShowCount !== 1 ? "s" : ""}</span>}
              </p>
            </div>
          </div>
          {registeredGameDates.length > 0 ? (
            <div className="border-t border-card-border pt-3 mt-1">
              <p className="text-[10px] font-bold uppercase tracking-[1px] text-text-muted mb-2">Registered Games</p>
              <div className="flex flex-col gap-1.5">
                {registeredGameDates.map(({ date, isNoShow }) => {
                  const d = new Date(date + "T00:00:00");
                  const formatted = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                  return (
                    <div
                      key={date}
                      className={`flex items-center justify-between rounded-[8px] px-3 py-2.5 ${isNoShow ? "bg-warning-soft/50" : "bg-accent-soft/30"}`}
                    >
                      <div>
                        <span className="text-[12px] font-semibold">{formatted}</span>
                        {isNoShow && <span className="ml-2 text-[10px] font-bold text-warning-dark">No-Show</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNoShow(date, user.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                          isNoShow
                            ? "bg-accent-soft text-accent-hover hover:bg-accent/20"
                            : "bg-warning-soft text-warning-dark hover:bg-warning-soft/80"
                        }`}
                      >
                        {isNoShow ? "Clear" : "Mark No-Show"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No game registrations yet</p>
          )}
        </div>
      </div>

      {/* Delete User — super admins only, cannot delete yourself */}
      {isSuperAdmin && currentUser?.id !== user.id && (
        <div className="rounded-[16px] border border-destructive/20 bg-destructive/5 p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-destructive/10 text-destructive shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-destructive">Delete User</p>
                <p className="text-[11px] text-text-muted font-medium">Permanently remove this user and all their data</p>
              </div>
            </div>
            {!confirmDelete ? (
              <Button variant="destructive" size="sm" className="w-full" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
                Delete User
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    const result = await deleteUser(user.id);
                    if (result.ok) {
                      router.push("/admin/users");
                    } else {
                      setDeleting(false);
                      setConfirmDelete(false);
                    }
                  }}
                >
                  {deleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
