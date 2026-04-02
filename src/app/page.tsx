import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-accent tracking-widest sm:text-5xl">LAMPA</h1>
      <p className="mt-2 text-sm text-muted">La Marea Pickleball Association</p>
      <p className="mt-6 max-w-xs text-muted text-sm leading-relaxed">
        Register and manage your daily pickleball games at La Marea.
      </p>
      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/login"
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-accent text-white font-medium transition-colors hover:bg-accent-hover shadow-sm"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Link>
        <Link
          href="/register"
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-card-border text-foreground font-medium transition-colors hover:bg-card"
        >
          <UserPlus className="h-4 w-4" />
          Create
        </Link>
      </div>
    </div>
  );
}
