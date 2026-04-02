"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/file-upload";
import { AlertCircle, ArrowLeft, ArrowRight, UserPlus, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import Link from "next/link";

type Step = 1 | 2 | 3;

export function RegisterForm() {
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [laMareaId, setLaMareaId] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function validateStep1(): boolean {
    if (!username || !password || !confirmPassword) { setError("Please fill in all fields"); return false; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return false; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return false; }
    return true;
  }

  function validateStep2(): boolean {
    if (!fullName || !email || !mobile || !address) { setError("Please fill in all fields"); return false; }
    if (!email.includes("@")) { setError("Please enter a valid email"); return false; }
    return true;
  }

  function handleNext() {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!laMareaId) { setError("Please upload your La Marea ID"); return; }
    if (!acceptedTerms) { setError("Please accept the terms and conditions"); return; }
    const success = register({ username, password, confirmPassword, fullName, email, mobile, address, laMareaId, acceptedTerms });
    if (success) router.push("/dashboard");
    else setError("Username already taken");
  }

  const steps = [
    { num: 1, label: "Account" },
    { num: 2, label: "Personal" },
    { num: 3, label: "Verify" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-accent tracking-wider">LAMPA</h1>
        <p className="text-xs text-muted mt-1">La Marea Pickleball Association</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-1">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
              step > s.num ? "bg-success text-white" : step === s.num ? "bg-accent text-white" : "bg-card-border text-muted"
            )}>
              {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 w-10", step > s.num ? "bg-success" : "bg-card-border")} />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted font-medium">{steps[step - 1].label}</p>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {step === 1 && (
        <>
          <div className="flex flex-col gap-1.5"><Label htmlFor="reg-user">Username</Label><Input id="reg-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" autoComplete="username" /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="reg-pass">Password</Label><Input id="reg-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="reg-confirm">Confirm Password</Label><Input id="reg-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" /></div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex flex-col gap-1.5"><Label htmlFor="reg-name">Full Name</Label><Input id="reg-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As on La Marea ID" /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="reg-email">Email</Label><Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="reg-mobile">Mobile Number</Label><Input id="reg-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="09XX XXX XXXX" /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="reg-address">Address</Label><Input id="reg-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Block & Lot, La Marea" /></div>
        </>
      )}

      {step === 3 && (
        <>
          <FileUpload label="La Marea ID (screenshot)" onChange={setLaMareaId} />
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(v)} />
            <span className="text-sm">I accept the terms and conditions</span>
          </label>
          <Link href="/terms" className="text-xs text-accent hover:underline -mt-2" target="_blank">
            Read Terms & Conditions
          </Link>
        </>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => { setError(""); setStep((step - 1) as Step); }}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" size="lg" className="flex-1" onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" size="lg" className="flex-1">
            <UserPlus className="h-4 w-4" />
            Create Account
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">Sign In</Link>
      </p>
    </form>
  );
}
