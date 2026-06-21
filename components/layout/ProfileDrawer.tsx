"use client";

import Link from "next/link";
import { FiChevronRight, FiCreditCard, FiGlobe, FiHelpCircle, FiLock, FiLogOut, FiShield, FiX } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { appTheme } from "@/components/layout/app-theme";

type ProfileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function kycBadgeClass(status: string) {
  if (status === "verified") return "border-secondary/30 bg-secondary/10 text-secondary";
  if (status === "rejected") return "border-red-400/30 bg-red-400/10 text-red-400";
  return "border-primary/30 bg-primary/10 text-primary";
}

export function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const { user, kycStatus, logout } = useAuth();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close profile"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-[#161a1e] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
          <h2 className="text-lg font-bold text-white">Profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#848e9c] hover:bg-white/[0.06]"
          >
            <FiX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className={`${appTheme.card} mb-4`}>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <p className="text-sm font-medium text-white">{user?.email ?? "User"}</p>
            <div className="mt-3 flex items-center gap-2">
              <FiShield className="text-[#848e9c]" />
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${kycBadgeClass(kycStatus)}`}
              >
                KYC: {kycStatus}
              </span>
            </div>
            {kycStatus !== "verified" && (
              <Link
                href="/kyc?start=1"
                onClick={onClose}
                className={`${appTheme.btnPrimary} mt-4 inline-flex w-full items-center justify-center`}
              >
                {kycStatus === "rejected" ? "Retry verification" : "Complete verification"}
              </Link>
            )}
          </div>

          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#848e9c]">
            Settings
          </p>
          <div className={`${appTheme.card} divide-y divide-white/[0.06] p-0`}>
            {[
              { label: "Security", href: "#", icon: FiLock },
              { label: "Payment methods", href: "#", icon: FiCreditCard },
              { label: "Language", href: "#", icon: FiGlobe },
              { label: "Support", href: "#", icon: FiHelpCircle },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between px-4 py-3.5 text-sm text-[#eaecef] transition hover:bg-white/[0.03]"
                onClick={onClose}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="text-[#848e9c]" />
                  {item.label}
                </span>
                <FiChevronRight className="text-[#848e9c]" />
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              void logout();
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-400/15"
          >
            <FiLogOut />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
