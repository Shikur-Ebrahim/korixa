"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import {
  FiGrid,
  FiUsers,
  FiShield,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: FiGrid, exact: true },
  { href: "/admin/users", label: "Users", icon: FiUsers },
  { href: "/admin/kyc", label: "KYC", icon: FiShield },
  { href: "/admin/deposits", label: "Deposits", icon: FiArrowDownCircle },
  { href: "/admin/settings", label: "Settings", icon: FiSettings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Top header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0b0e11]/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-[#0b0e11]">
            K
          </span>
          <span className="text-sm font-bold tracking-wide text-white">
            Korixa <span className="text-primary">Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-[#848e9c] sm:block">
            {user?.email}
          </span>
          <button
            onClick={() => void logout()}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-medium text-[#848e9c] transition hover:text-white"
          >
            <FiLogOut className="text-xs" />
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-lg px-4 pb-24 pt-[72px]">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-[#161a1e]/98 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition ${
                  active ? "text-primary" : "text-[#848e9c]"
                }`}
              >
                <Icon className="text-lg" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
