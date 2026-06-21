"use client";

import { FiEye, FiEyeOff } from "react-icons/fi";
import { BalanceSparkline } from "@/components/home/BalanceSparkline";
import { formatUsd, formatPercent } from "@/lib/format";

type BalanceHeroCardProps = {
  total: number;
  changePercent: number;
  chartData: number[];
  hideBalance: boolean;
  onToggleHide: () => void;
  loading?: boolean;
};

export function BalanceHeroCard({
  total,
  changePercent,
  chartData,
  hideBalance,
  onToggleHide,
  loading,
}: BalanceHeroCardProps) {
  const positive = changePercent >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#1a1f26] via-[#161a1e] to-[#12151a] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      {/* Ambient glow */}
      <div
        className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${
          positive ? "bg-secondary/10" : "bg-red-500/10"
        }`}
        aria-hidden
      />
      <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-primary/5 blur-2xl" aria-hidden />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#848e9c]">
              Estimated balance (USD)
            </p>
            {loading ? (
              <div className="mt-2 h-9 w-40 animate-pulse rounded-lg bg-white/5" />
            ) : (
              <p className="mt-1.5 text-[2rem] font-bold leading-none tracking-tight text-white">
                {hideBalance ? "••••••" : formatUsd(total)}
              </p>
            )}
            {!loading && (
              <div className="mt-2 inline-flex items-center gap-1.5">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                    positive
                      ? "bg-secondary/15 text-secondary"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {hideBalance ? "••••" : formatPercent(changePercent)}
                </span>
                <span className="text-xs text-[#848e9c]">today</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleHide}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#0b0e11]/80 text-[#848e9c] transition hover:border-white/15 hover:text-white"
            aria-label={hideBalance ? "Show balance" : "Hide balance"}
          >
            {hideBalance ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
          </button>
        </div>

        {!loading && chartData.length > 1 && (
          <BalanceSparkline data={chartData} positive={positive} />
        )}
      </div>
    </div>
  );
}
