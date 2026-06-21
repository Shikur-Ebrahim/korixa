"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiCreditCard, FiDownload, FiRefreshCw, FiUpload } from "react-icons/fi";
import { BalanceHeroCard } from "@/components/home/BalanceHeroCard";
import { HomeWatchlist } from "@/components/home/HomeWatchlist";
import { MarketTrackRow } from "@/components/home/MarketTrackRow";
import { VerificationNotice } from "@/components/deposit/VerificationNotice";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDepositGate } from "@/hooks/useDepositGate";
import {
  buildWatchlist,
  computeUserBalance,
  useHomeMarketData,
} from "@/hooks/useBinanceMarket";
import { loadBalances, loadFavorites } from "@/lib/trade/storage";

export function HomeScreen() {
  const { kycStatus } = useAuth();
  const { openDeposit, notice, dismissNotice } = useDepositGate();
  const { data, isLoading, error } = useHomeMarketData();
  const [hideBalance, setHideBalance] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setBalances(loadBalances());
    setFavorites(loadFavorites());
  }, []);

  const userBalance = useMemo(() => {
    if (!data?.tickerMap) return null;
    return computeUserBalance(balances, data.tickerMap);
  }, [balances, data?.tickerMap]);

  const watchlist = useMemo(() => {
    if (!data?.tickerMap) return [];
    return buildWatchlist(data.tickerMap, favorites);
  }, [data?.tickerMap, favorites]);

  return (
    <div className="space-y-4">
      <VerificationNotice message={notice} onDismiss={dismissNotice} />

      {kycStatus !== "verified" && (
        <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Complete verification</p>
              <p className="mt-0.5 truncate text-xs text-[#848e9c]">
                {kycStatus === "rejected"
                  ? "Resubmit documents to unlock trading"
                  : "Verify to deposit, withdraw & trade"}
              </p>
            </div>
            <Link
              href="/kyc?start=1"
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-[#0b0e11]"
            >
              Verify
            </Link>
          </div>
        </div>
      )}

      <BalanceHeroCard
        total={userBalance?.total ?? 0}
        changePercent={userBalance?.weightedChange ?? 0}
        chartData={data?.chartCloses ?? []}
        hideBalance={hideBalance}
        onToggleHide={() => setHideBalance((v) => !v)}
        loading={isLoading}
      />

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Trade", href: "/trade", icon: FiRefreshCw },
          { label: "Card", href: "/card", icon: FiCreditCard },
          { label: "Deposit", icon: FiDownload, action: openDeposit },
          { label: "Withdraw", href: "/assets", icon: FiUpload },
        ].map((action) => {
          const Icon = action.icon;
          const className =
            "flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#161a1e] py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.04]";

          if (action.action) {
            return (
              <button key={action.label} type="button" onClick={action.action} className={className}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b0e11] text-primary">
                  <Icon className="text-base" />
                </span>
                {action.label}
              </button>
            );
          }

          return (
            <Link key={action.label} href={action.href!} className={className}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b0e11] text-primary">
                <Icon className="text-base" />
              </span>
              {action.label}
            </Link>
          );
        })}
      </div>

      <MarketTrackRow
        btcPrice={data?.btcPrice ?? 0}
        btcChange={data?.btcChange ?? 0}
        ethPrice={data?.ethPrice ?? 0}
        ethChange={data?.ethChange ?? 0}
        loading={isLoading}
      />

      <HomeWatchlist items={watchlist} loading={isLoading} />

      {error && !isLoading && (
        <p className="text-center text-xs text-[#848e9c]">
          Live prices may be delayed. Balance uses last known rates.
        </p>
      )}
    </div>
  );
}
