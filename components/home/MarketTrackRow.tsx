"use client";

import { formatUsd, formatPercent } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";

type MarketTrackRowProps = {
  btcPrice: number;
  btcChange: number;
  ethPrice: number;
  ethChange: number;
  loading?: boolean;
};

export function MarketTrackRow({
  btcPrice,
  btcChange,
  ethPrice,
  ethChange,
  loading,
}: MarketTrackRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className={`${appTheme.card} h-[72px] animate-pulse bg-white/[0.02]`} />
        ))}
      </div>
    );
  }

  const items = [
    { symbol: "BTC", price: btcPrice, change: btcChange },
    { symbol: "ETH", price: ethPrice, change: ethChange },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const up = item.change >= 0;
        return (
          <div key={item.symbol} className={`${appTheme.card} py-3`}>
            <p className="text-[11px] font-medium text-[#848e9c]">{item.symbol}/USDT</p>
            <p className="mt-1 text-base font-semibold text-white">{formatUsd(item.price)}</p>
            <p className={`mt-0.5 text-xs font-medium ${up ? appTheme.positive : appTheme.negative}`}>
              {formatPercent(item.change)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
