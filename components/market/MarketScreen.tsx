"use client";

import { useCallback, useState } from "react";
import type { AppMarketPageData } from "@/lib/coingecko";
import { MarketCoinList } from "@/components/market/MarketCoinList";
import { MarketDataCard } from "@/components/market/MarketDataCard";
import { MarketHighlights } from "@/components/market/MarketHighlights";
import { MarketKeyMetrics, type MetricsFocus } from "@/components/market/MarketKeyMetrics";
import { MarketSentimentCard } from "@/components/market/MarketSentimentCard";
import { TrendingSectorsCard } from "@/components/market/TrendingSectorsCard";
import Link from "next/link";

type MarketScreenProps = {
  data: AppMarketPageData;
};

type TopTab = "overview" | "metrics";

export function MarketScreen({ data }: MarketScreenProps) {
  const [topTab, setTopTab] = useState<TopTab>("overview");
  const [metricsFocus, setMetricsFocus] = useState<MetricsFocus>(null);

  const newlyListedIds = data.newlyListed.map((c) => c.id);

  const openMetrics = useCallback((focus: MetricsFocus) => {
    setMetricsFocus(focus);
    setTopTab("metrics");
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b border-white/[0.06]">
        {(
          [
            { id: "overview" as const, label: "Overview" },
            { id: "metrics" as const, label: "Key Metrics" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setTopTab(tab.id);
              if (tab.id === "overview") setMetricsFocus(null);
            }}
            className={`relative pb-2.5 text-sm font-medium transition ${
              topTab === tab.id ? "text-white" : "text-[#848e9c]"
            }`}
          >
            {tab.label}
            {topTab === tab.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
        <Link
          href="/p2p/buy"
          className="relative pb-2.5 text-sm font-medium text-[#848e9c] hover:text-white transition"
        >
          P2P
        </Link>
      </div>

      {topTab === "overview" ? (
        <>
          <div className="space-y-3">
            <MarketSentimentCard
              sentiment={data.sentiment}
              onViewMore={() => openMetrics("sentiment")}
            />
            <MarketDataCard
              global={data.global}
              btcCoin={data.btcCoin}
              onViewMore={() => openMetrics("data")}
            />
            <TrendingSectorsCard categories={data.categories} />
          </div>

          <MarketHighlights
            topGainers={data.topGainers.slice(0, 3)}
            newlyListed={data.newlyListed.slice(0, 3)}
            trending={data.trending.slice(0, 3)}
          />
        </>
      ) : (
        <MarketKeyMetrics data={data} focus={metricsFocus} />
      )}

      <MarketCoinList coins={data.coins} newlyListedIds={newlyListedIds} />
    </div>
  );
}
