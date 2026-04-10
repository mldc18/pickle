"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CameraCapture } from "@/components/ui/camera-capture";
import { AlertCircle, ArrowLeft, ArrowRight, UserPlus, Check, ScrollText } from "lucide-react";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { registerStep1Schema, registerStep2Schema, registerStep3Schema } from "@/lib/schemas";

type Step = 1 | 2 | 3;

const WAIVER_PREAMBLE =
  "I, the undersigned member of the La Marea Pickleball Association (LAMPA), hereby acknowledge and agree to the following terms and conditions in relation to my participation in LAMPA game nights and activities:";

const WAIVER_TEXT = [
  {
    title: "1. Personal Property Liability",
    text: "I understand and agree that the organizers, officers, and representatives of LAMPA shall not be held liable or responsible for any loss, theft, or damage to my personal property brought to the court during game nights or related activities.",
  },
  {
    title: "2. Assumption of Risk and Safety",
    text: "I acknowledge that participation in pickleball activities involves inherent risks, including but not limited to physical injury, accidents, or unforeseen incidents. I hereby agree that the organizers, officers, and representatives of LAMPA shall not be held responsible or liable for any injury or accident that may occur during the game night.\n\nI further understand that I am responsible for my own safety and well-being. I agree to take necessary precautions, including wearing proper footwear and appropriate safety gear, to minimize the risk of injury.",
  },
  {
    title: "3. Voluntary Participation",
    text: "I confirm that my participation in LAMPA activities is voluntary, and I assume full responsibility for any risks associated with my involvement.",
  },
];

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const waiverRef = useRef<HTMLDivElement>(null);
  const [profilePhoto, setProfilePhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function validateStep1(): boolean {
    const parsed = registerStep1Schema.safeParse({ username, password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const parsed = registerStep2Schema.safeParse({ fullName, email, mobile, address });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return false;
    }
    return true;
  }

  function handleNext() {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = registerStep3Schema.safeParse({ acceptedTerms, profilePhoto });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const result = await register({
      username,
      password,
      confirmPassword,
      fullName,
      email,
      mobile,
      address,
      acceptedTerms,
      profilePhoto: parsed.data.profilePhoto,
    });
    setSubmitting(false);
    if (result.ok) router.push("/dashboard");
    else setError(result.error);
  }

  function handleWaiverScroll() {
    if (waiverRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = waiverRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setScrolledToBottom(true);
      }
    }
  }

  function handleAcceptWaiver() {
    setAcceptedTerms(true);
    setShowWaiver(false);
  }

  const steps = [
    { num: 1, label: "Account" },
    { num: 2, label: "Personal" },
    { num: 3, label: "Verify" },
  ];

  return (
    <>
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-foreground transition-colors mb-6">
        ← Back
      </Link>
      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-[20px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] animate-fade-up flex flex-col gap-5">
        <div className="flex justify-center mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lampa-logo.png"
            alt="LAMPA — La Marea Pickleball Association"
            className="h-24 w-24 rounded-full object-cover"
          />
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
          <div className="flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 rounded-[8px] p-3">
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
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-2 rounded-[8px] border border-card-border p-4">
              <Label>Profile Photo</Label>
              <CameraCapture
                previewUrl={photoPreview}
                onCapture={(blob, url) => {
                  if (photoPreview) URL.revokeObjectURL(photoPreview);
                  setProfilePhoto(blob);
                  setPhotoPreview(url);
                }}
                onRetake={() => {
                  if (photoPreview) URL.revokeObjectURL(photoPreview);
                  setProfilePhoto(null);
                  setPhotoPreview(null);
                }}
              />
            </div>

            {/* Waiver */}
            <div className="rounded-[8px] border border-card-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={acceptedTerms} onCheckedChange={() => {
                      if (!acceptedTerms) {
                        setShowWaiver(true);
                      } else {
                        setAcceptedTerms(false);
                      }
                    }} />
                    <span className="text-sm">I accept the waiver</span>
                  </label>
                </div>
                {acceptedTerms && <Check className="h-4 w-4 text-success" />}
              </div>
              <button
                type="button"
                onClick={() => { setShowWaiver(true); setScrolledToBottom(false); }}
                className="flex items-center gap-1 text-[11px] text-accent-hover font-bold hover:underline mt-2"
              >
                <ScrollText className="h-3 w-3" />
                Read Waiver & Terms
              </button>
            </div>
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
            <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
              <UserPlus className="h-4 w-4" />
              {submitting ? "Creating..." : "Create Account"}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <a href="/login" className="text-accent-hover font-semibold hover:underline">Sign In</a>
        </p>
      </form>

      {/* Waiver Modal */}
      {showWaiver && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="w-full max-w-lg bg-card rounded-t-[16px] sm:rounded-[16px] border border-card-border shadow-xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-card-border shrink-0">
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-accent-hover" />
                <h2 className="font-bold">Waiver & Terms</h2>
              </div>
              <button
                onClick={() => setShowWaiver(false)}
                className="text-muted hover:text-foreground text-xl leading-none p-1"
              >
                &times;
              </button>
            </div>

            {/* Scrollable content */}
            <div
              ref={waiverRef}
              onScroll={handleWaiverScroll}
              className="flex-1 overflow-y-auto p-4"
            >
              <p className="text-xs text-muted mb-4 leading-relaxed">{WAIVER_PREAMBLE}</p>
              <div className="flex flex-col gap-4">
                {WAIVER_TEXT.map((section, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-semibold mb-1">{section.title}</h3>
                    <p className="text-xs text-muted leading-relaxed whitespace-pre-line">{section.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-card-border">
                <p className="text-xs text-muted mb-1">
                  By clicking &quot;I Accept&quot;, I confirm that I have read, understood, and agree to the terms of this waiver.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-card-border shrink-0 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowWaiver(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!scrolledToBottom}
                onClick={handleAcceptWaiver}
              >
                <Check className="h-4 w-4" />
                {scrolledToBottom ? "I Accept" : "Scroll to accept"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
