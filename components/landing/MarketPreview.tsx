import { Card } from "@/components/ui/Card";
import { ChangeBadge } from "@/components/landing/market/ChangeBadge";
import { CoinAvatar } from "@/components/landing/market/CoinAvatar";
import { GlobalStatsBar } from "@/components/landing/market/GlobalStatsBar";
import { InsightList } from "@/components/landing/market/InsightList";
import { MarketTable } from "@/components/landing/market/MarketTable";
import { formatUsd } from "@/lib/format";
import { getMarketOverviewData } from "@/lib/coingecko";
import type { MarketCoin } from "@/lib/coingecko";

import { TopGainersList } from "@/components/landing/market/TopGainersList";

export async function MarketPreview() {
  let data;

  try {
    data = await getMarketOverviewData();
  } catch {
    return (
      <section id="markets" className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mb-2 text-lg font-bold sm:text-xl">Market Overview</h2>
          <Card className="py-8">
            <p className="text-sm text-muted">
              Market data is temporarily unavailable. Please check back shortly.
            </p>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="markets" className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 text-center sm:mb-6">
          <h2 className="mb-1.5 text-lg font-bold sm:text-xl">Market Overview</h2>
          <p className="text-xs text-muted sm:text-sm">
            Live cryptocurrency prices by market cap
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <GlobalStatsBar global={data.global} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InsightList title="Trending Coins" coins={data.trending} accent="primary" />
            <TopGainersList coins={data.topGainers} />
          </div>

          <MarketTable coins={data.coins} />
        </div>
      </div>
    </section>
  );
}
