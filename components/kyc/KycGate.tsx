"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FiLock } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { appTheme } from "@/components/layout/app-theme";

type KycGateProps = {
  children: ReactNode;
  featureName?: string;
};

export function KycGate({ children, featureName = "trading features" }: KycGateProps) {
  const { kycStatus, kycLoading } = useAuth();

  if (kycLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (kycStatus === "verified") {
    return children;
  }

  return (
    <div className={`${appTheme.card} text-center`}>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FiLock className="text-2xl" />
      </div>
      <h2 className="mb-2 text-base font-semibold text-white sm:text-lg">
        Verify account to enable trading
      </h2>
      <p className="mx-auto mb-4 max-w-md text-xs text-[#848e9c] sm:text-sm">
        {kycStatus === "rejected"
          ? "Your verification was rejected. Please submit clearer ID and selfie photos."
          : kycStatus === "pending"
            ? "Your verification is currently processing. Please wait."
            : `Complete KYC to unlock ${featureName}.`}
      </p>
      {kycStatus === "pending" ? (
        <button disabled className={`${appTheme.btnPrimary} inline-flex px-5 py-2.5 opacity-50 cursor-not-allowed`}>
          Processing...
        </button>
      ) : (
        <Link
          href="/kyc?start=1"
          className={`${appTheme.btnPrimary} inline-flex px-5 py-2.5`}
        >
          {kycStatus === "rejected" ? "Retry verification" : "Verify now"}
        </Link>
      )}
    </div>
  );
}
