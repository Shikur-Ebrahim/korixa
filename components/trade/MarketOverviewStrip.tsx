"use client";

import { useMarketHighlights } from "@/hooks/useBinanceMarket";
import { formatPercent } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";
import { TradeSkeleton } from "@/components/trade/TradeStates";

export function MarketOverviewStrip() {
  const { highlights, isLoading } = useMarketHighlights();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${appTheme.card} h-16 min-w-[120px] animate-pulse`} />
        ))}
      </div>
    );
  }

  if (!highlights) return null;

  const sections = [
    { title: "Top Gainers", items: highlights.gainers, up: true },
    { title: "Top Losers", items: highlights.losers, up: false },
    { title: "Trending", items: highlights.trending, up: true },
  ];

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {sections.map((section) => (
        <div key={section.title} className={`${appTheme.card} min-w-[130px] shrink-0 p-3`}>
          <p className="mb-2 text-[10px] font-semibold uppercase text-[#848e9c]">
            {section.title}
          </p>
          <ul className="space-y-1.5">
            {section.items.map((item) => {
              const sym = item.symbol.replace("USDT", "");
              const pct = parseFloat(item.priceChangePercent);
              return (
                <li key={item.symbol} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-medium text-white">{sym}</span>
                  <span className={pct >= 0 ? appTheme.positive : appTheme.negative}>
                    {formatPercent(pct)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
