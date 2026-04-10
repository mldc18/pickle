import Link from "next/link";
import { Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#34D399]/5 via-transparent to-[#FBBF24]/5" />

      <div className="relative z-10 flex flex-col items-center animate-fade-up">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[22px] shadow-[0_8px_28px_rgba(52,211,153,0.25)]" style={{ background: "linear-gradient(145deg, #34D399, #059669)" }}>
          <Trophy className="h-10 w-10 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-[-1px] text-accent-hover">LAMPA</h1>
        <p className="mt-1 text-[13px] font-semibold tracking-[2px] uppercase text-muted">La Marea Pickleball Association</p>
        <p className="mt-4 mb-10 max-w-[300px] text-[15px] text-muted leading-relaxed">
          Register and join daily open play sessions at La Marea.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[300px]">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-[14px] font-extrabold text-base text-[#111] shadow-[0_4px_16px_rgba(52,211,153,0.25)] transition-all hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(52,211,153,0.35)] active:translate-y-0"
            style={{ background: "var(--accent)" }}
          >
            → Sign In
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-[14px] font-bold text-base text-foreground bg-card border-[1.5px] border-card-border transition-all hover:border-accent hover:bg-accent-soft"
          >
            ⊕ Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
