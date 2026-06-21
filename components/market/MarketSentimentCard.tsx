"use client";

import type { MarketSentiment } from "@/lib/coingecko";
import { appTheme } from "@/components/layout/app-theme";

type MarketSentimentCardProps = {
  sentiment: MarketSentiment;
  onViewMore?: () => void;
  hideViewMore?: boolean;
};

export function MarketSentimentCard({ sentiment, onViewMore, hideViewMore }: MarketSentimentCardProps) {
  const angle = -90 + (sentiment.score / 100) * 180;
  const needleColor =
    sentiment.score <= 45 ? "#f87171" : sentiment.score <= 55 ? "#fbbf24" : "#22c55e";

  return (
    <div className={appTheme.card}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Market Sentiment</h3>
        {!hideViewMore && (
          <button
            type="button"
            onClick={onViewMore}
            className="text-xs font-medium text-primary transition hover:text-primary/80"
          >
            View More →
          </button>
        )}
      </div>

      <div className="relative mx-auto h-24 w-44">
        <svg viewBox="0 0 120 70" className="h-full w-full">
          <path
            d="M 12 60 A 48 48 0 0 1 108 60"
            fill="none"
            stroke="#2b3139"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 12 60 A 48 48 0 0 1 60 12"
            fill="none"
            stroke="#f87171"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 60 12 A 48 48 0 0 1 108 60"
            fill="none"
            stroke="#22c55e"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.85"
          />
          <g transform={`rotate(${angle} 60 60)`}>
            <line x1="60" y1="60" x2="60" y2="22" stroke={needleColor} strokeWidth="2.5" />
            <circle cx="60" cy="60" r="4" fill={needleColor} />
          </g>
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="text-2xl font-bold text-white">{sentiment.score}</p>
          <p className="text-xs text-[#848e9c]">{sentiment.label}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10px] font-medium">
          <span className={appTheme.positive}>Long {sentiment.longRatio}</span>
          <span className={appTheme.negative}>Short {sentiment.shortRatio}</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full">
          <div className="bg-secondary" style={{ width: `${sentiment.longRatio}%` }} />
          <div className="bg-red-500" style={{ width: `${sentiment.shortRatio}%` }} />
        </div>
      </div>
    </div>
  );
}

export function MarketSentimentDetail({ sentiment }: { sentiment: MarketSentiment }) {
  const zones = [
    { label: "Extreme Fear", range: "0–25", active: sentiment.score <= 25 },
    { label: "Fear", range: "26–45", active: sentiment.score > 25 && sentiment.score <= 45 },
    { label: "Neutral", range: "46–55", active: sentiment.score > 45 && sentiment.score <= 55 },
    { label: "Greed", range: "56–75", active: sentiment.score > 55 && sentiment.score <= 75 },
    { label: "Extreme Greed", range: "76–100", active: sentiment.score > 75 },
  ];

  return (
    <div id="market-sentiment-detail" className={`${appTheme.card} scroll-mt-20 space-y-4`}>
      <h3 className="text-base font-semibold text-white">Market Sentiment Details</h3>
      <MarketSentimentCard sentiment={sentiment} hideViewMore />
      <div className="space-y-2">
        {zones.map((zone) => (
          <div
            key={zone.label}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
              zone.active ? "bg-primary/10 text-primary" : "bg-[#0b0e11] text-[#848e9c]"
            }`}
          >
            <span>{zone.label}</span>
            <span>{zone.range}</span>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-[#848e9c]">
        Sentiment score is estimated from global market cap change and the ratio of top coins
        moving up vs down in the last 24 hours. Long/short ratio reflects bullish vs bearish
        movement across the top 50 assets.
      </p>
    </div>
  );
}
