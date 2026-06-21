"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { appTheme } from "@/components/layout/app-theme";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trade", label: "Trade" },
  { href: "/wallet", label: "Wallet" },
];

export function AppShellHeader() {
  const pathname = usePathname();
  const { user, kycStatus, logout } = useAuth();

  return (
    <header className={appTheme.header}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo size="sm" />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
                  active ? appTheme.navActive : appTheme.navIdle
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {kycStatus !== "verified" && (
            <Link
              href="/kyc?start=1"
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
                pathname.startsWith("/kyc") ? appTheme.navActive : appTheme.navIdle
              }`}
            >
              KYC
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {kycStatus === "verified" ? (
            <span className="hidden rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary sm:inline">
              Verified
            </span>
          ) : null}

          {user && (
            <button type="button" onClick={() => logout()} className={appTheme.btnOutline}>
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
