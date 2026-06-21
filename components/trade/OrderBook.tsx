"use client";

import { useTrade } from "@/components/trade/TradeProvider";
import { useBinanceDepth } from "@/hooks/useBinanceMarket";
import { appTheme } from "@/components/layout/app-theme";
import { TradeEmptyState, TradeSkeleton } from "@/components/trade/TradeStates";

export function OrderBook() {
  const { pair } = useTrade();
  const { data, isLoading, error } = useBinanceDepth(pair.symbol);

  if (isLoading) return <TradeSkeleton />;
  if (error || !data) {
    return (
      <div className={appTheme.card}>
        <TradeEmptyState message="Order book unavailable." />
      </div>
    );
  }

  const bestAsk = parseFloat(data.asks[0]?.[0] ?? "0");
  const bestBid = parseFloat(data.bids[0]?.[0] ?? "0");
  const spread = bestAsk - bestBid;
  const spreadPct = bestAsk ? (spread / bestAsk) * 100 : 0;

  const asks = [...data.asks].reverse().slice(0, 8);
  const bids = data.bids.slice(0, 8);

  return (
    <div className={`${appTheme.card} p-0`}>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <p className="text-xs font-semibold text-white">Order Book</p>
        <p className="text-[10px] text-[#848e9c]">
          Spread {spread.toFixed(2)} ({spreadPct.toFixed(3)}%)
        </p>
      </div>

      <div className="grid grid-cols-2 px-3 py-1 text-[10px] font-medium uppercase text-[#848e9c]">
        <span>Price</span>
        <span className="text-right">Amount</span>
      </div>

      <div className="max-h-52 overflow-y-auto">
        {asks.map(([price, qty]) => (
          <div key={`ask-${price}`} className="grid grid-cols-2 px-3 py-0.5 text-[11px]">
            <span className={appTheme.negative}>{parseFloat(price).toFixed(2)}</span>
            <span className="text-right text-[#848e9c]">{parseFloat(qty).toFixed(4)}</span>
          </div>
        ))}

        <div className="my-1 border-y border-white/[0.06] py-1 text-center text-[10px] text-[#848e9c]">
          Mid {((bestAsk + bestBid) / 2).toFixed(2)}
        </div>

        {bids.map(([price, qty]) => (
          <div key={`bid-${price}`} className="grid grid-cols-2 px-3 py-0.5 text-[11px]">
            <span className={appTheme.positive}>{parseFloat(price).toFixed(2)}</span>
            <span className="text-right text-[#848e9c]">{parseFloat(qty).toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
