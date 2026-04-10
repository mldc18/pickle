"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username) setSubmitted(true);
  }

  return (
    <div className="w-full max-w-[400px]">
      <Link href="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-foreground transition-colors mb-6">
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

        <h2 className="text-[20px] font-extrabold text-center mb-6">Reset Password</h2>

        {submitted ? (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-accent-hover bg-accent-soft rounded-[12px] p-3 border border-accent/15">
              <CheckCircle className="h-4 w-4 shrink-0" />
              If an account with that username exists, password reset instructions have been sent.
            </div>
            <Link href="/login" className="text-sm font-semibold text-accent-hover hover:text-accent transition-colors">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted text-center font-medium mb-5">
              Enter your username and we&#39;ll send reset instructions.
            </p>
            <div className="mb-[18px]">
              <label className="block text-[13px] font-bold text-foreground mb-1.5">Username</label>
              <Input id="forgot-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
            </div>
            <button
              type="submit"
              className="w-full py-4 mt-1.5 mb-5 rounded-[14px] font-extrabold text-base text-[#111] transition-all cursor-pointer border-0 shadow-[0_4px_16px_rgba(52,211,153,0.25)] hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(52,211,153,0.35)] active:translate-y-0 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}
            >
              → Send Reset Link
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm font-semibold text-accent-hover hover:text-accent transition-colors">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
