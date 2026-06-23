"use client";

import Link from "next/link";
import {
  FiChevronRight,
  FiCreditCard,
  FiGlobe,
  FiHelpCircle,
  FiLock,
  FiLogOut,
  FiShield,
  FiX,
  FiUserCheck,
  FiBriefcase,
  FiSettings,
  FiGift,
  FiBell,
  FiFileText,
  FiCopy,
  FiCheck
} from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { appTheme } from "@/components/layout/app-theme";
import { useState } from "react";

type ProfileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function kycBadgeClass(status: string) {
  if (status === "verified") return "border-secondary/30 bg-secondary/10 text-secondary";
  if (status === "rejected") return "border-red-400/30 bg-red-400/10 text-red-400";
  return "border-primary/30 bg-primary/10 text-primary";
}

const MENU_GROUPS = [
  {
    title: "Account & Security",
    items: [
      { label: "Security Center", href: "#", icon: FiLock },
      { label: "Two-Factor Authentication", href: "#", icon: FiShield },
      { label: "Identity Verification", href: "/kyc", icon: FiUserCheck },
    ],
  },
  {
    title: "Assets & Finance",
    items: [
      { label: "Funding Account", href: "/wallet", icon: FiBriefcase },
      { label: "Spot Account", href: "#", icon: FiBriefcase },
      { label: "Transaction History", href: "#", icon: FiFileText },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Payment Methods", href: "#", icon: FiCreditCard },
      { label: "Trading Settings", href: "#", icon: FiSettings },
      { label: "Notifications", href: "#", icon: FiBell },
      { label: "Language & Currency", href: "#", icon: FiGlobe },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Rewards & Referral", href: "#", icon: FiGift },
      { label: "Support & FAQ", href: "#", icon: FiHelpCircle },
      { label: "Legal & Privacy", href: "#", icon: FiFileText },
    ],
  },
];

export function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const { user, kycStatus, logout } = useAuth();
  const [copiedUid, setCopiedUid] = useState(false);

  if (!open) return null;

  const joinDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
    : "Recently";

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close profile"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-[#0b0e11] shadow-2xl transition-transform duration-300">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-xl font-bold text-white">Profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#848e9c] hover:bg-white/[0.06] hover:text-white transition"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 scrollbar-hide">
          {/* Enhanced Profile Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#161a1e] to-[#0b0e11] p-5 shadow-lg relative overflow-hidden">
            {/* Background subtle glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary ring-2 ring-primary/20">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-white">
                  {user?.displayName || "Korixa User"}
                </p>
                <p className="truncate text-xs text-[#848e9c] mt-0.5">
                  {user?.email ?? "No email"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-[#1e2329] px-1.5 py-0.5 text-[10px] font-mono text-[#848e9c] flex items-center gap-1 cursor-pointer hover:text-white transition" onClick={handleCopyUid}>
                    UID: {user?.uid?.slice(0, 8)}...
                    {copiedUid ? <FiCheck className="text-green-500" /> : <FiCopy />}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${kycBadgeClass(kycStatus)}`}>
                <FiShield size={10} />
                {kycStatus}
              </span>
              <span className="rounded-full border border-[#f5b300]/30 bg-[#f5b300]/10 px-2 py-0.5 text-[10px] font-bold text-[#f5b300]">
                VIP 0
              </span>
              <span className="rounded-full bg-[#1e2329] px-2 py-0.5 text-[10px] font-medium text-[#848e9c]">
                Joined {joinDate}
              </span>
            </div>

            {kycStatus !== "verified" && (
              <Link
                href="/kyc?start=1"
                onClick={onClose}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {kycStatus === "rejected" ? "Retry Identity Verification" : "Complete Identity Verification"}
              </Link>
            )}
          </div>

          {/* Dynamic Menu Groups */}
          {MENU_GROUPS.map((group, idx) => (
            <div key={group.title} className="mt-6">
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[#848e9c]">
                {group.title}
              </p>
              <div className="rounded-xl border border-white/[0.04] bg-[#161a1e] divide-y divide-white/[0.04] overflow-hidden">
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between px-4 py-3.5 text-sm text-[#eaecef] transition hover:bg-white/[0.04]"
                    onClick={onClose}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="text-[#848e9c] text-lg" />
                      {item.label}
                    </span>
                    <FiChevronRight className="text-[#848e9c]" />
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                void logout();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e2329] py-3.5 text-sm font-bold text-white transition hover:bg-[#2b3139]"
            >
              <FiLogOut />
              Logout
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3.5 text-sm font-bold text-red-500 transition hover:bg-red-500/10"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
