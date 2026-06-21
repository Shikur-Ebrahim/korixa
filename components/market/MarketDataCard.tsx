"use client";

import type { GlobalMarketStats, MarketCoin } from "@/lib/coingecko";
import { Sparkline } from "@/components/landing/market/Sparkline";
import { formatUsd, formatPercent } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";

type MarketDataCardProps = {
  global: GlobalMarketStats;
  btcCoin: MarketCoin | null;
  onViewMore?: () => void;
};

export function MarketDataCard({ global, btcCoin, onViewMore }: MarketDataCardProps) {
  const volumeUp = global.marketCapChange24h >= 0;
  const sparkData = btcCoin?.sparkline.slice(-24) ?? [];

  return (
    <div className={appTheme.card}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Market Data</h3>
        <button
          type="button"
          onClick={onViewMore}
          className="text-xs font-medium text-primary transition hover:text-primary/80"
        >
          View More →
        </button>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-[#848e9c]">Trading Vol.</p>
          <p className="mt-1 text-xl font-bold text-white">
            {formatUsd(global.totalVolume24h, true)}
          </p>
          <p className={`mt-1 text-xs font-medium ${volumeUp ? appTheme.positive : appTheme.negative}`}>
            {formatPercent(global.marketCapChange24h)}
          </p>
        </div>
        {sparkData.length > 1 && (
          <Sparkline data={sparkData} positive={volumeUp} className="h-12 w-20" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 text-[11px]">
        <div>
          <p className="text-[#848e9c]">Market Cap</p>
          <p className="font-medium text-white">{formatUsd(global.totalMarketCap, true)}</p>
        </div>
        <div>
          <p className="text-[#848e9c]">BTC Dominance</p>
          <p className="font-medium text-white">{global.btcDominance.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

export function MarketDataDetail({
  global,
  btcCoin,
}: {
  global: GlobalMarketStats;
  btcCoin: MarketCoin | null;
}) {
  const sparkData = btcCoin?.sparkline ?? [];
  const up = global.marketCapChange24h >= 0;

  return (
    <div id="market-data-detail" className={`${appTheme.card} scroll-mt-20 space-y-4`}>
      <h3 className="text-base font-semibold text-white">Market Data Details</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#0b0e11] p-3">
          <p className="text-[11px] text-[#848e9c]">Total Market Cap</p>
          <p className="mt-1 text-lg font-bold text-white">{formatUsd(global.totalMarketCap, true)}</p>
          <p className={`mt-1 text-xs ${up ? appTheme.positive : appTheme.negative}`}>
            {formatPercent(global.marketCapChange24h)}
          </p>
        </div>
        <div className="rounded-xl bg-[#0b0e11] p-3">
          <p className="text-[11px] text-[#848e9c]">24h Trading Volume</p>
          <p className="mt-1 text-lg font-bold text-white">{formatUsd(global.totalVolume24h, true)}</p>
        </div>
        <div className="rounded-xl bg-[#0b0e11] p-3">
          <p className="text-[11px] text-[#848e9c]">BTC Dominance</p>
          <p className="mt-1 text-lg font-bold text-white">{global.btcDominance.toFixed(2)}%</p>
        </div>
        <div className="rounded-xl bg-[#0b0e11] p-3">
          <p className="text-[11px] text-[#848e9c]">Active Cryptocurrencies</p>
          <p className="mt-1 text-lg font-bold text-white">
            {global.activeCryptos.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {sparkData.length > 1 && (
        <div>
          <p className="mb-2 text-xs text-[#848e9c]">BTC 7-day trend</p>
          <div className="rounded-xl bg-[#0b0e11] p-3">
            <Sparkline data={sparkData} positive={up} className="h-16 w-full" />
          </div>
        </div>
      )}

      {btcCoin && (
        <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 text-[11px]">
          <div>
            <p className="text-[#848e9c]">BTC Price</p>
            <p className="font-medium text-white">{formatUsd(btcCoin.price)}</p>
          </div>
          <div>
            <p className="text-[#848e9c]">BTC 24h Change</p>
            <p className={`font-medium ${up ? appTheme.positive : appTheme.negative}`}>
              {formatPercent(btcCoin.change24h)}
            </p>
          </div>
          <div>
            <p className="text-[#848e9c]">24h High</p>
            <p className="text-white">{formatUsd(btcCoin.high24h)}</p>
          </div>
          <div>
            <p className="text-[#848e9c]">24h Low</p>
            <p className="text-white">{formatUsd(btcCoin.low24h)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
