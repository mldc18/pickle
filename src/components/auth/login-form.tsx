"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = loginFormSchema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fill in all fields");
      return;
    }
    setSubmitting(true);
    const success = await login(parsed.data.username, parsed.data.password);
    setSubmitting(false);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-foreground transition-colors mb-6">
        ← Back
      </Link>
      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-[20px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] animate-fade-up">
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lampa-logo.jpg"
            alt="LAMPA — La Marea Pickleball Association"
            className="h-24 w-24 rounded-full object-cover"
          />
        </div>

        <h2 className="text-[20px] font-extrabold text-center mb-6">Sign In</h2>

        {error && (
          <div className="flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 rounded-[12px] p-3 mb-5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-[18px]">
          <label className="block text-[13px] font-bold text-foreground mb-1.5">Username</label>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your username"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div className="mb-[18px]">
          <label className="block text-[13px] font-bold text-foreground mb-1.5">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 mt-1.5 mb-5 rounded-[14px] font-extrabold text-base text-[#111] transition-all cursor-pointer border-0 shadow-[0_4px_16px_rgba(52,211,153,0.25)] hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(52,211,153,0.35)] active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)" }}
        >
          {submitting ? "Signing In..." : "→ Sign In"}
        </button>

        <div className="text-center">
          <Link href="/forgot-password" className="block text-sm font-semibold text-accent-hover hover:text-accent transition-colors mb-2">
            Forgot password?
          </Link>
          <span className="text-sm text-muted">No account? </span>
          <Link href="/register" className="text-sm font-semibold text-accent-hover hover:text-accent transition-colors">
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}
