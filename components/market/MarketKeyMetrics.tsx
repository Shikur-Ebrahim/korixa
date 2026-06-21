"use client";

import { useEffect } from "react";
import type { AppMarketPageData } from "@/lib/coingecko";
import { MarketDataDetail } from "@/components/market/MarketDataCard";
import { MarketSentimentDetail } from "@/components/market/MarketSentimentCard";
import { formatUsd, formatPercent } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";

export type MetricsFocus = "sentiment" | "data" | null;

type MarketKeyMetricsProps = {
  data: AppMarketPageData;
  focus?: MetricsFocus;
};

export function MarketKeyMetrics({ data, focus = null }: MarketKeyMetricsProps) {
  const { global, btcCoin, topLosers } = data;

  useEffect(() => {
    if (!focus) return;

    const targetId =
      focus === "sentiment" ? "market-sentiment-detail" : "market-data-detail";

    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [focus]);

  return (
    <div className="space-y-3">
      <MarketSentimentDetail sentiment={data.sentiment} />
      <MarketDataDetail global={global} btcCoin={btcCoin} />

      <div className={`${appTheme.card} grid grid-cols-2 gap-3`}>
        <div>
          <p className="text-[11px] text-[#848e9c]">Total Market Cap</p>
          <p className="mt-1 text-lg font-bold text-white">{formatUsd(global.totalMarketCap, true)}</p>
          <p className={`text-xs ${global.marketCapChange24h >= 0 ? appTheme.positive : appTheme.negative}`}>
            {formatPercent(global.marketCapChange24h)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#848e9c]">24h Volume</p>
          <p className="mt-1 text-lg font-bold text-white">{formatUsd(global.totalVolume24h, true)}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#848e9c]">BTC Dominance</p>
          <p className="mt-1 text-lg font-bold text-white">{global.btcDominance.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-[11px] text-[#848e9c]">Active Cryptos</p>
          <p className="mt-1 text-lg font-bold text-white">
            {global.activeCryptos.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {btcCoin && (
        <div className={appTheme.card}>
          <p className="mb-2 text-sm font-semibold text-white">Bitcoin</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-white">{formatUsd(btcCoin.price)}</p>
            <ChangeBadgeInline value={btcCoin.change24h} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-[#848e9c]">24h High</p>
              <p className="text-white">{formatUsd(btcCoin.high24h)}</p>
            </div>
            <div>
              <p className="text-[#848e9c]">24h Low</p>
              <p className="text-white">{formatUsd(btcCoin.low24h)}</p>
            </div>
          </div>
        </div>
      )}

      <div className={appTheme.card}>
        <p className="mb-2 text-sm font-semibold text-white">Top Losers (24h)</p>
        <ul className="space-y-2">
          {topLosers.map((coin) => (
            <li key={coin.id} className="flex items-center justify-between text-sm">
              <span className="text-white">{coin.symbol}/USDT</span>
              <ChangeBadgeInline value={coin.change24h} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChangeBadgeInline({ value }: { value: number | null }) {
  const positive = (value ?? 0) >= 0;
  return (
    <span className={`text-xs font-medium ${positive ? appTheme.positive : appTheme.negative}`}>
      {formatPercent(value)}
    </span>
  );
}
