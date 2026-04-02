"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogIn } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }
    const success = login(username, password);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-accent tracking-wider">LAMPA</h1>
        <p className="text-xs text-muted mt-1">La Marea Pickleball Association</p>
      </div>

      <h2 className="text-lg font-semibold text-center">Sign In</h2>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" autoComplete="username" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
      </div>

      <Button type="submit" size="lg" className="w-full">
        <LogIn className="h-4 w-4" />
        Sign In
      </Button>

      <div className="flex flex-col gap-2 text-center text-sm">
        <Link href="/forgot-password" className="text-accent hover:underline">
          Forgot password?
        </Link>
        <p className="text-muted">
          No account?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Register
          </Link>
        </p>
      </div>
    </form>
  );
}
