"use client";

import type { DepositRecord } from "@/lib/deposit/types";
import { formatCryptoAmount } from "@/lib/assets/utils";
import { appTheme } from "@/components/layout/app-theme";

type DepositStatusTrackerProps = {
  deposits: DepositRecord[];
  loading?: boolean;
};

const STATUS_STYLE = {
  pending: "bg-amber-500/15 text-amber-300",
  confirmed: "bg-secondary/15 text-secondary",
  failed: "bg-red-500/15 text-red-400",
} as const;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DepositStatusTracker({ deposits, loading }: DepositStatusTrackerProps) {
  const cryptoDeposits = deposits.filter((d) => d.token === "USDT" && d.txHash);

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#848e9c]">Deposit Status</p>
        {[0, 1].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (cryptoDeposits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-center">
        <p className="text-xs text-[#848e9c]">
          Waiting for incoming deposit. Status updates automatically after confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[#848e9c]">Deposit Status</p>
      {cryptoDeposits.slice(0, 5).map((deposit) => (
        <div
          key={deposit.id}
          className={`${appTheme.card} flex items-center justify-between gap-3 py-3`}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">
              {formatCryptoAmount(deposit.amount)} {deposit.token}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-[#848e9c]">
              {deposit.chain.toUpperCase()} · {formatTime(deposit.createdAt)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLE[deposit.status]}`}
          >
            {deposit.status}
          </span>
        </div>
      ))}
    </div>
  );
}
