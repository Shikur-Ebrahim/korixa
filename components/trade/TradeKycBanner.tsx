"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function TradeKycBanner() {
  const { kycStatus, kycLoading } = useAuth();

  if (kycLoading || kycStatus === "verified") return null;

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">View-only mode</p>
          <p className="mt-1 text-xs text-[#848e9c]">
            {kycStatus === "rejected"
              ? "Verification rejected. Resubmit to unlock buy & sell."
              : "Complete verification to place buy and sell orders."}
          </p>
        </div>
        <Link
          href="/kyc?start=1"
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-[#0b0e11]"
        >
          Verify
        </Link>
      </div>
    </div>
  );
}
