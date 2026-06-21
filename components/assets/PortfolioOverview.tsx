"use client";

import { FiEye, FiEyeOff, FiRefreshCw } from "react-icons/fi";
import { formatUsd, formatPercent, formatSignedUsd } from "@/lib/format";

type PortfolioOverviewProps = {
  totalValue: number;
  profitToday: number;
  changePercent: number;
  lastUpdated: Date | null;
  hideBalance: boolean;
  onToggleHide: () => void;
  loading?: boolean;
  onRefresh?: () => void;
};

function formatUpdatedTime(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function PortfolioOverview({
  totalValue,
  profitToday,
  changePercent,
  lastUpdated,
  hideBalance,
  onToggleHide,
  loading,
  onRefresh,
}: PortfolioOverviewProps) {
  const positive = changePercent >= 0;
  const profitPositive = profitToday >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#1a1f26] via-[#161a1e] to-[#12151a] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-300">
      <div
        className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${
          positive ? "bg-secondary/10" : "bg-red-500/10"
        }`}
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-[#848e9c]">
              Total Portfolio Value
            </p>
            {loading ? (
              <div className="mt-2 h-9 w-44 animate-pulse rounded-lg bg-white/5" />
            ) : (
              <p className="mt-1.5 text-[2rem] font-bold leading-none tracking-tight text-white">
                {hideBalance ? "••••••" : formatUsd(totalValue)}
              </p>
            )}

            {!loading && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="rounded-lg bg-[#0b0e11]/60 px-2.5 py-1">
                  <p className="text-[10px] text-[#848e9c]">Today&apos;s P/L</p>
                  <p
                    className={`text-sm font-semibold ${
                      profitPositive ? "text-secondary" : "text-red-400"
                    }`}
                  >
                    {hideBalance ? "••••" : formatSignedUsd(profitToday)}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold ${
                    positive ? "bg-secondary/15 text-secondary" : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {hideBalance ? "••••" : formatPercent(changePercent)}
                </span>
              </div>
            )}

            {!loading && (
              <p className="mt-2 text-[10px] text-[#848e9c]">
                Last updated {formatUpdatedTime(lastUpdated)}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={onToggleHide}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#0b0e11]/80 text-[#848e9c] transition hover:border-white/15 hover:text-white"
              aria-label={hideBalance ? "Show balance" : "Hide balance"}
            >
              {hideBalance ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
            </button>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#0b0e11]/80 text-[#848e9c] transition hover:border-white/15 hover:text-white"
                aria-label="Refresh portfolio"
              >
                <FiRefreshCw className="text-sm" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
