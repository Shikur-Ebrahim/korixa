"use client";

import { formatUsd, formatPercent } from "@/lib/format";
import { formatCryptoAmount } from "@/lib/assets/utils";
import type { AssetHolding, SortOption } from "@/lib/assets/types";
import { appTheme } from "@/components/layout/app-theme";
import { FiSearch } from "react-icons/fi";

type AssetHoldingsProps = {
  holdings: AssetHolding[];
  hideBalance: boolean;
  loading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
};

function CoinIcon({ symbol, color }: { symbol: string; color: string }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}
    >
      {symbol.slice(0, 1)}
    </div>
  );
}

function HoldingsSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${appTheme.card} flex animate-pulse items-center gap-3 py-3.5`}>
          <div className="h-10 w-10 rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-16 rounded bg-white/5" />
            <div className="h-2 w-24 rounded bg-white/5" />
          </div>
          <div className="h-4 w-20 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "value", label: "Value" },
  { id: "profit", label: "Profit" },
  { id: "alpha", label: "A–Z" },
];

export function AssetHoldings({
  holdings,
  hideBalance,
  loading,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: AssetHoldingsProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className={appTheme.sectionTitle}>Asset Holdings</h2>
        <span className="text-xs text-[#848e9c]">{holdings.length} assets</span>
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#161a1e] px-3 py-2.5">
        <FiSearch className="shrink-0 text-[#848e9c]" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search assets"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#848e9c]"
        />
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSortChange(option.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              sort === option.id
                ? "bg-primary text-[#0b0e11]"
                : "border border-white/[0.06] bg-[#161a1e] text-[#848e9c] hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <HoldingsSkeleton />
      ) : holdings.length === 0 ? (
        <div className={`${appTheme.card} py-8 text-center`}>
          <p className="text-sm text-[#848e9c]">No assets match your search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {holdings.map((asset) => {
            const up = asset.change24h >= 0;
            return (
              <div
                key={asset.symbol}
                className={`${appTheme.card} flex items-center justify-between gap-3 py-3.5 transition duration-200 hover:border-white/10`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CoinIcon symbol={asset.symbol} color={asset.color} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{asset.symbol}</p>
                    <p className="truncate text-[11px] text-[#848e9c]">{asset.name}</p>
                    <p className="mt-0.5 text-[11px] text-[#848e9c]">
                      Avail. {hideBalance ? "••••" : formatCryptoAmount(asset.amount)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-white">
                    {hideBalance ? "••••" : formatUsd(asset.usdValue)}
                  </p>
                  <p className={`text-[11px] font-medium ${up ? appTheme.positive : appTheme.negative}`}>
                    {formatPercent(asset.change24h)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
