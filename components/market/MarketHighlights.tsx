"use client";

import { CoinAvatar } from "@/components/landing/market/CoinAvatar";
import { ChangeBadge } from "@/components/landing/market/ChangeBadge";
import type { MarketCoin, TrendingCoin } from "@/lib/coingecko";
import { formatUsd } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";

type HighlightColumnProps = {
  title: string;
  items: Array<{
    id: string;
    symbol: string;
    name: string;
    image: string;
    price: number;
    change24h: number | null;
  }>;
};

function HighlightColumn({ title, items }: HighlightColumnProps) {
  return (
    <div className={`${appTheme.card} min-w-[140px] flex-1 p-3`}>
      <p className="mb-2 text-xs font-semibold text-white">{title}</p>
      <ul className="space-y-2.5">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="w-3 text-[10px] text-[#848e9c]">{index + 1}</span>
              <CoinAvatar src={item.image} symbol={item.symbol} size={22} />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-white">{item.symbol}/USDT</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-medium text-white">{formatUsd(item.price)}</p>
              <ChangeBadge value={item.change24h} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type MarketHighlightsProps = {
  topGainers: MarketCoin[];
  newlyListed: MarketCoin[];
  trending: TrendingCoin[];
};

export function MarketHighlights({ topGainers, newlyListed, trending }: MarketHighlightsProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <HighlightColumn title="Top Gainers" items={topGainers} />
      <HighlightColumn title="Newly Listed" items={newlyListed} />
      <HighlightColumn title="Trending" items={trending} />
    </div>
  );
}
