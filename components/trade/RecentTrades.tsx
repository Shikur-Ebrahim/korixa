"use client";

import { useTrade } from "@/components/trade/TradeProvider";
import { useBinanceTrades } from "@/hooks/useBinanceMarket";
import { appTheme } from "@/components/layout/app-theme";
import { TradeEmptyState } from "@/components/trade/TradeStates";

export function RecentTrades() {
  const { pair } = useTrade();
  const { data, isLoading } = useBinanceTrades(pair.symbol);

  return (
    <div className={`${appTheme.card} p-0`}>
      <p className="border-b border-white/[0.06] px-3 py-2 text-xs font-semibold text-white">
        Recent Trades
      </p>

      <div className="grid grid-cols-3 px-3 py-1 text-[10px] font-medium uppercase text-[#848e9c]">
        <span>Price</span>
        <span className="text-center">Amount</span>
        <span className="text-right">Time</span>
      </div>

      <div className="max-h-52 overflow-y-auto">
        {isLoading ? (
          <div className="animate-pulse space-y-2 p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 rounded bg-white/5" />
            ))}
          </div>
        ) : !data?.length ? (
          <TradeEmptyState message="No recent trades." />
        ) : (
          data.map((trade) => {
            const time = new Date(trade.time).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            const isSell = trade.isBuyerMaker;

            return (
              <div
                key={trade.id}
                className="grid grid-cols-3 px-3 py-1 text-[11px]"
              >
                <span className={isSell ? appTheme.negative : appTheme.positive}>
                  {parseFloat(trade.price).toFixed(2)}
                </span>
                <span className="text-center text-[#848e9c]">
                  {parseFloat(trade.qty).toFixed(4)}
                </span>
                <span className="text-right text-[#848e9c]">{time}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
