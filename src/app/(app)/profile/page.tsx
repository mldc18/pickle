"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useApp } from "@/context/app-context";
import { Camera, User, Mail, Phone, MapPin, Calendar, CreditCard, LogOut, ShieldAlert } from "lucide-react";

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const { users, updateOwnPhoto } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!user) return null;

  // Pull live isPaid / paymentHistory from app-context (sourced from
  // monthly_payments). Admins and super_admins are considered active.
  const liveRow = users.find((u) => u.id === user.id);
  const isActive = isAdmin || (liveRow?.isPaid ?? false);
  const paymentHistory = liveRow?.paymentHistory ?? user.paymentHistory;

  // Prefer the user-editable display photo; fall back to the security selfie.
  const displayPhoto = liveRow?.photoUrl ?? user.photoUrl ?? user.avatarUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Photo must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const url = await updateOwnPhoto(file);
      if (!url) setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const fields = [
    { label: "Full Name", value: user.fullName, icon: User },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Mobile", value: user.mobile, icon: Phone },
    { label: "Address", value: user.address, icon: MapPin },
    { label: "Emergency Contact", value: user.emergencyContactName || "Not set", icon: ShieldAlert },
    { label: "Emergency Number", value: user.emergencyContactNumber || "Not set", icon: Phone },
    { label: "Member Since", value: user.createdAt, icon: Calendar },
  ];

  // Group payment history by year
  const historyByYear: Record<string, { month: string; monthName: string; paid: boolean }[]> = {};
  for (const entry of paymentHistory) {
    const [year, monthNum] = entry.month.split("-");
    const date = new Date(Number(year), Number(monthNum) - 1);
    const monthName = date.toLocaleDateString("en-US", { month: "long" });
    if (!historyByYear[year]) historyByYear[year] = [];
    historyByYear[year].push({ month: entry.month, monthName, paid: entry.paid });
  }
  const sortedYears = Object.keys(historyByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header Card */}
      <div className="relative bg-card border border-card-border rounded-[16px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden animate-fade-up">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, var(--accent), var(--warning))" }} />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative group flex h-[72px] w-[72px] items-center justify-center rounded-[16px] bg-accent-soft border-2 border-accent text-accent-hover text-xl font-extrabold overflow-hidden shrink-0 disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {displayPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayPhoto}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <>{user.firstName[0]}{user.lastName[0]}</>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <Camera className="h-6 w-6" strokeWidth={2} />
            </span>
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-[11px] font-bold">
                Uploading…
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-extrabold tracking-[-0.3px] truncate">{user.fullName}</p>
            <p className="text-[12px] text-text-muted font-medium">@{user.username}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] bg-accent-soft text-accent-hover text-[11px] font-bold px-2.5 py-1 border border-accent/20 hover:bg-accent/15 transition-colors disabled:opacity-60"
            >
              <Camera className="h-3.5 w-3.5" />
              {uploading
                ? "Uploading…"
                : displayPhoto
                  ? "Change photo"
                  : "Add photo"}
            </button>
          </div>
        </div>
        {uploadError && (
          <p className="mt-3 text-[12px] font-semibold text-destructive">
            {uploadError}
          </p>
        )}
        <p className="mt-3 text-[11px] leading-snug text-text-muted">
          This is the photo shown next to your name on the player list.
          Your registration selfie is kept separately for security.
        </p>
      </div>

      {/* Details */}
      <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted mb-4 block">Details</span>
        <div className="flex flex-col">
          {fields.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className={`flex items-center gap-3 py-3.5 ${i < fields.length - 1 ? "border-b border-card-border" : ""}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-input-bg text-muted">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[1px] text-text-muted font-medium">{f.label}</p>
                  <p className="text-[14px] font-semibold truncate">{f.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registration Status */}
      <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-accent-hover" />
          <span className="text-[11px] font-bold tracking-[2px] uppercase text-muted">Registration Status</span>
        </div>

        {/* Current Status Card */}
        <div className="flex items-center gap-3 bg-accent-soft border border-accent/20 rounded-[12px] px-4 py-3 mb-5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
          </span>
          <span className="text-[14px] font-bold text-accent-hover">
            {isActive ? "Active Member" : "Inactive — Payment Required"}
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {sortedYears.map((year) => (
            <div key={year}>
              <p className="text-[11px] font-bold tracking-[2px] uppercase text-text-muted mb-2">{year}</p>
              <div className="flex flex-col gap-1.5">
                {historyByYear[year].map((entry) => (
                  <div
                    key={entry.month}
                    className="flex items-center justify-between rounded-[8px] bg-card border border-card-border px-3 py-2.5"
                  >
                    <span className="text-[14px] font-semibold">{entry.monthName}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${entry.paid ? "bg-accent-soft text-accent-hover" : "bg-destructive/10 text-destructive"}`}>
                      {entry.paid ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[14px] border-[1.5px] border-destructive/20 bg-destructive/5 text-destructive text-[14px] font-bold transition-all hover:bg-destructive/10 hover:border-destructive/40 cursor-pointer animate-fade-up"
        style={{ animationDelay: "0.3s" }}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
