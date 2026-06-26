"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function KycVerificationBanner() {
  const pathname = usePathname();
  const { user, initialized, kycStatus } = useAuth();

  if (!initialized || !user || kycStatus === "verified" || pathname.startsWith("/kyc")) {
    return null;
  }

  const isRejected = kycStatus === "rejected";
  const isPending = kycStatus === "pending";

  return (
    <div
      className={`border-b px-4 py-2.5 sm:px-6 ${
        isRejected ? "border-red-200 bg-red-50" : isPending ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="text-xs text-gray-700 sm:text-sm">
          {isRejected ? "Verification rejected — please try again" : isPending ? "Verification processing..." : "Complete verification"}
        </p>
        {isPending ? (
          <span className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold sm:text-sm bg-blue-500 text-white opacity-70">
            Processing
          </span>
        ) : (
          <Link
            href="/kyc?start=1"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold sm:text-sm ${
              isRejected
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isRejected ? "Retry" : "Verify now"}
          </Link>
        )}
      </div>
    </div>
  );
}
