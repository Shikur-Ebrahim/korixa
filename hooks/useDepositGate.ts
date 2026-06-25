"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const VERIFY_MESSAGE = "Please complete verification to access deposits.";

export function useDepositGate() {
  const router = useRouter();
  const { kycStatus, kycLoading } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);

  const isVerified = kycStatus === "verified";

  const openDeposit = useCallback(() => {
    if (kycLoading) return;

    if (!isVerified) {
      setNotice(VERIFY_MESSAGE);
      window.setTimeout(() => {
        router.push("/kyc?start=1");
      }, 1800);
      return;
    }

    router.push("?deposit=open");
  }, [isVerified, kycLoading, router]);

  const dismissNotice = useCallback(() => setNotice(null), []);

  return {
    openDeposit,
    notice,
    dismissNotice,
    isVerified,
    kycLoading,
    verifyMessage: VERIFY_MESSAGE,
  };
}
