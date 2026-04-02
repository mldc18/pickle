"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username) setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-accent tracking-wider">LAMPA</h1>
        <p className="text-xs text-muted mt-1">La Marea Pickleball Association</p>
      </div>

      <h2 className="text-lg font-semibold text-center">Reset Password</h2>

      {submitted ? (
        <div className="text-center flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-success bg-success/10 rounded-lg p-3">
            <CheckCircle className="h-4 w-4 shrink-0" />
            If an account with that username exists, password reset instructions have been sent.
          </div>
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            <ArrowLeft className="h-3 w-3" />
            Back to Sign In
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted text-center">
            Enter your username and we&#39;ll send reset instructions.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="forgot-user">Username</Label>
            <Input id="forgot-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
          </div>
          <Button type="submit" size="lg" className="w-full">
            <Send className="h-4 w-4" />
            Send Reset Link
          </Button>
          <Link href="/login" className="inline-flex items-center justify-center gap-1 text-sm text-accent hover:underline">
            <ArrowLeft className="h-3 w-3" />
            Back to Sign In
          </Link>
        </>
      )}
    </form>
  );
}
