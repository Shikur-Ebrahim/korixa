import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <Logo size="sm" />

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted sm:justify-end">
            <Link href="#terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="#privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Korixa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
