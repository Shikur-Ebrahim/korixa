"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";

export function Header() {
  const { user, loading, initialized, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Logo size="sm" adminTapCount={15} />

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/contact"
            className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-500 transition hover:bg-blue-500/20 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            Contact Support
          </Link>
          {!loading && initialized && user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-background sm:text-sm"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:bg-white/5 hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <Button href="/sign-up" variant="primary" className="px-3 py-2 text-xs sm:px-4 sm:text-sm">
              Get started
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
