"use client";

import { useTrade } from "@/components/trade/TradeProvider";
import { formatUsd } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";
import { TradeEmptyState } from "@/components/trade/TradeStates";

export function TradeHistory() {
  const { tradeHistory } = useTrade();

  return (
    <div className={`${appTheme.card} p-0`}>
      <p className="border-b border-white/[0.06] px-4 py-3 text-sm font-semibold text-white">
        Order History
      </p>

      {!tradeHistory.length ? (
        <TradeEmptyState message="No trade history yet." />
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {tradeHistory.map((trade) => {
            const date = new Date(trade.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={trade.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{trade.pair}</p>
                    <p
                      className={`text-xs font-semibold capitalize ${
                        trade.side === "buy" ? "text-secondary" : "text-red-400"
                      }`}
                    >
                      {trade.side}
                    </p>
                  </div>
                  <p className="text-[10px] text-[#848e9c]">{date}</p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <p className="text-[#848e9c]">Qty</p>
                    <p className="text-white">{trade.amount.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-[#848e9c]">Price</p>
                    <p className="text-white">{formatUsd(trade.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#848e9c]">Total</p>
                    <p className="text-white">{formatUsd(trade.total)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
