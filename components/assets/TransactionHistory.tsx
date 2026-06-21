"use client";

import { formatCryptoAmount } from "@/lib/assets/utils";
import type { AssetTransaction, AssetTransactionType } from "@/lib/assets/types";
import { appTheme } from "@/components/layout/app-theme";

type TransactionHistoryProps = {
  transactions: AssetTransaction[];
  loading?: boolean;
};

const TYPE_LABELS: Record<AssetTransactionType, string> = {
  deposit: "Deposit",
  withdraw: "Withdraw",
  buy: "Buy",
  sell: "Sell",
  transfer: "Transfer",
};

const TYPE_COLORS: Record<AssetTransactionType, string> = {
  deposit: "bg-secondary/15 text-secondary",
  withdraw: "bg-red-500/15 text-red-400",
  buy: "bg-blue-500/15 text-blue-400",
  sell: "bg-orange-500/15 text-orange-400",
  transfer: "bg-primary/15 text-primary",
};

const STATUS_COLORS = {
  completed: "text-secondary",
  pending: "text-primary",
  failed: "text-red-400",
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TransactionHistory({ transactions, loading }: TransactionHistoryProps) {
  if (loading) {
    return (
      <div id="asset-history">
        <h2 className={`${appTheme.sectionTitle} mb-3`}>Recent Transactions</h2>
        <div className={`${appTheme.card} divide-y divide-white/[0.06] p-0`}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse justify-between px-4 py-3.5">
              <div className="h-4 w-24 rounded bg-white/5" />
              <div className="h-4 w-16 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="asset-history">
      <h2 className={`${appTheme.sectionTitle} mb-3`}>Recent Transactions</h2>
      <div className={`${appTheme.card} divide-y divide-white/[0.06] p-0`}>
        {transactions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#848e9c]">No transactions yet.</p>
        ) : (
          transactions.slice(0, 10).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[tx.type]}`}
                  >
                    {TYPE_LABELS[tx.type]}
                  </span>
                  <span className="text-sm font-medium text-white">{tx.coin}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#848e9c]">{formatDate(tx.date)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-white">
                  {formatCryptoAmount(tx.amount)} {tx.coin}
                </p>
                <p className={`text-[11px] capitalize ${STATUS_COLORS[tx.status]}`}>{tx.status}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
