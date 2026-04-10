import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#34D399]/5 via-transparent to-[#FBBF24]/5" />

      <div className="relative z-10 flex flex-col items-center animate-fade-up">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lampa-logo.jpg"
          alt="LAMPA — La Marea Pickleball Association"
          className="mb-4 h-32 w-32 rounded-full object-cover shadow-[0_8px_28px_rgba(52,211,153,0.25)]"
        />
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
