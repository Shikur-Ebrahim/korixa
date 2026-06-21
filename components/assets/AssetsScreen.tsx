"use client";

import { useMemo, useRef, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { AllocationChart } from "@/components/assets/AllocationChart";
import { AssetHoldings } from "@/components/assets/AssetHoldings";
import { EmptyPortfolioState } from "@/components/assets/EmptyPortfolioState";
import { PortfolioOverview } from "@/components/assets/PortfolioOverview";
import { QuickActions } from "@/components/assets/QuickActions";
import { TransactionHistory } from "@/components/assets/TransactionHistory";
import { VerificationNotice } from "@/components/deposit/VerificationNotice";
import { useAssetsData } from "@/hooks/useAssetsData";
import { useDepositGate } from "@/hooks/useDepositGate";
import { filterHoldings, sortHoldings } from "@/lib/assets/utils";
import type { SortOption } from "@/lib/assets/types";

export function AssetsScreen() {
  const { openDeposit, notice, dismissNotice } = useDepositGate();
  const {
    holdings,
    summary,
    allocation,
    transactions,
    isEmpty,
    isLoading,
    error,
    lastUpdated,
    refresh,
  } = useAssetsData();

  const [hideBalance, setHideBalance] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("value");
  const historyRef = useRef<HTMLDivElement>(null);

  const filteredHoldings = useMemo(() => {
    const filtered = filterHoldings(holdings, search);
    return sortHoldings(filtered, sort);
  }, [holdings, search, sort]);

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-4 pb-2">
      <VerificationNotice message={notice} onDismiss={dismissNotice} />

      <PortfolioOverview
        totalValue={summary.totalValue}
        profitToday={summary.profitToday}
        changePercent={summary.changePercent}
        lastUpdated={lastUpdated}
        hideBalance={hideBalance}
        onToggleHide={() => setHideBalance((v) => !v)}
        loading={isLoading}
        onRefresh={() => void refresh()}
      />

      <QuickActions
        onDeposit={openDeposit}
        onWithdraw={scrollToHistory}
        onTransfer={scrollToHistory}
        onHistory={scrollToHistory}
      />

      {error && !isLoading && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <FiAlertCircle className="mt-0.5 shrink-0 text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">Unable to load live prices</p>
            <p className="mt-0.5 text-xs text-[#848e9c]">
              Showing cached balances. Pull to refresh or tap the refresh button above.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="shrink-0 text-xs font-semibold text-primary"
          >
            Retry
          </button>
        </div>
      )}

      {isEmpty && !isLoading ? (
        <EmptyPortfolioState onDeposit={openDeposit} />
      ) : (
        <>
          <AllocationChart slices={allocation} loading={isLoading} hideBalance={hideBalance} />

          <AssetHoldings
            holdings={filteredHoldings}
            hideBalance={hideBalance}
            loading={isLoading}
            search={search}
            onSearchChange={setSearch}
            sort={sort}
            onSortChange={setSort}
          />
        </>
      )}

      <div ref={historyRef}>
        <TransactionHistory transactions={transactions} loading={isLoading} />
      </div>
    </div>
  );
}
