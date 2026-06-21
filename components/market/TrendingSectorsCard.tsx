"use client";

import type { MarketCategory } from "@/lib/coingecko";
import { formatPercent } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";

type TrendingSectorsCardProps = {
  categories: MarketCategory[];
};

export function TrendingSectorsCard({ categories }: TrendingSectorsCardProps) {
  return (
    <div className={appTheme.card}>
      <h3 className="mb-3 text-sm font-semibold text-white">Trending Sectors</h3>
      <ul className="space-y-3">
        {categories.slice(0, 5).map((cat) => {
          const top = cat.topCoins[0];
          const up = (cat.marketCapChange24h ?? 0) >= 0;

          return (
            <li key={cat.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{cat.name}</p>
                {top && (
                  <p className="text-[10px] text-[#848e9c]">
                    {top.symbol}{" "}
                    <span className={(top.change24h ?? 0) >= 0 ? appTheme.positive : appTheme.negative}>
                      {formatPercent(top.change24h)}
                    </span>
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${up ? appTheme.positive : appTheme.negative}`}
              >
                {formatPercent(cat.marketCapChange24h)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
