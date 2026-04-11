"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="w-full">
      <div className="mx-auto flex h-12 max-w-[460px] items-center justify-between px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lampa-logo.jpg"
            alt="LAMPA"
            className="h-9 w-9 rounded-full object-cover"
          />
          <span className="text-[22px] font-extrabold text-accent-hover tracking-[-0.5px]">
            LAMPA
          </span>
        </Link>
      </div>
    </header>
  );
}
