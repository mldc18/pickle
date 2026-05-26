"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { changePasswordSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { changePassword, logout, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;
  const mustChangePassword = user.mustChangePassword;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = changePasswordSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your password");
      return;
    }

    setSubmitting(true);
    const result = await changePassword(parsed.data.password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.replace("/dashboard");
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-[20px] border border-card-border bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] animate-fade-up"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-accent-soft text-accent-hover">
          <KeyRound className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-[20px] font-extrabold">Update Password</h1>
          <p className="text-[12px] font-medium text-muted">@{user.username}</p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-[12px] border border-accent/15 bg-accent-soft p-3 text-sm font-medium text-accent-hover">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {mustChangePassword
          ? "Create a new password before continuing."
          : "Choose a new password for your account."}
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-[12px] bg-destructive/10 p-3 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mb-[18px]">
        <Label
          htmlFor="new-password"
          className="mb-1.5 block text-[13px] font-bold text-foreground"
        >
          New Password
        </Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
      </div>

      <div className="mb-6">
        <Label
          htmlFor="confirm-new-password"
          className="mb-1.5 block text-[13px] font-bold text-foreground"
        >
          Confirm Password
        </Label>
        <Input
          id="confirm-new-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="h-12 w-full" disabled={submitting}>
        {submitting ? "Updating..." : "Update Password"}
      </Button>

      {mustChangePassword ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-3 h-10 w-full text-muted"
          onClick={handleLogout}
          disabled={submitting}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="mt-3 h-10 w-full text-muted"
          onClick={() => router.replace("/profile")}
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>
      )}
    </form>
  );
}
