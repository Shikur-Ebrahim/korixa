"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { BuyCryptoCard } from "@/components/deposit/BuyCryptoCard";
import { DepositCryptoCard } from "@/components/deposit/DepositCryptoCard";
import { DepositHero } from "@/components/deposit/DepositHero";
import { DepositQuickActions } from "@/components/deposit/QuickActions";
import { DepositStatusTracker } from "@/components/deposit/DepositStatusTracker";
import { FiatDepositCard } from "@/components/deposit/FiatDepositCard";
import { LearningCenter } from "@/components/deposit/LearningCenter";
import { P2PCard } from "@/components/deposit/P2PCard";
import { TransferCard } from "@/components/deposit/TransferCard";
import { VerificationNotice } from "@/components/deposit/VerificationNotice";
import { useDepositFlow } from "@/hooks/useDepositFlow";
import { useDepositGate } from "@/hooks/useDepositGate";
import { appTheme } from "@/components/layout/app-theme";
import { formatUsd } from "@/lib/format";

export function DepositScreen() {
  const router = useRouter();
  const historyRef = useRef<HTMLDivElement>(null);
  const { isVerified, kycLoading, verifyMessage } = useDepositGate();
  const {
    chain,
    setChain,
    addressData,
    createAddress,
    status,
    loadingAddress,
    loadingStatus,
    error,
  } = useDepositFlow();

  const usdtBalance = status?.balances.USDT ?? 0;

  useEffect(() => {
    if (kycLoading || isVerified) return;

    const timer = window.setTimeout(() => {
      router.push("/kyc?start=1");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [isVerified, kycLoading, router]);

  if (kycLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-white/5" />
        <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="space-y-4">
        <VerificationNotice message={verifyMessage} />
        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-6 text-center">
          <p className="text-sm font-semibold text-white">Verification required</p>
          <p className="mt-2 text-xs text-[#848e9c]">{verifyMessage}</p>
          <p className="mt-3 text-[11px] text-primary">Redirecting to verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DepositHero />

      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#1a1f26] to-[#12151a] p-4">
        <p className="text-xs text-[#848e9c]">Available USDT Balance</p>
        {loadingStatus ? (
          <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-white/5" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-white">{formatUsd(usdtBalance)}</p>
        )}
        {status?.network && (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[#848e9c]">
            Tatum {status.network} mode
          </p>
        )}
      </div>

      <DepositQuickActions
        onHistory={() => historyRef.current?.scrollIntoView({ behavior: "smooth" })}
      />

      <section className="space-y-3">
        <h2 className={appTheme.sectionTitle}>I Don&apos;t Have Crypto Assets</h2>
        <BuyCryptoCard />
        <P2PCard />
        <FiatDepositCard />
      </section>

      <section className="space-y-3">
        <h2 className={appTheme.sectionTitle}>I Have Crypto Assets</h2>
        <DepositCryptoCard
          chain={chain}
          onChainChange={setChain}
          addressData={addressData}
          deposits={status?.deposits ?? []}
          loadingAddress={loadingAddress}
          loadingStatus={loadingStatus}
          error={error}
          onGenerate={() => void createAddress()}
        />
        <TransferCard
          onTransfer={() => historyRef.current?.scrollIntoView({ behavior: "smooth" })}
        />
      </section>

      <LearningCenter />

      <div ref={historyRef} id="deposit-history">
        <h2 className={`${appTheme.sectionTitle} mb-3`}>Recent Deposits</h2>
        <DepositStatusTracker
          deposits={status?.deposits ?? []}
          loading={loadingStatus}
        />
      </div>
    </div>
  );
}
