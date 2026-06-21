import { Card } from "@/components/ui/Card";
import { ChangeBadge } from "@/components/landing/market/ChangeBadge";
import { CoinAvatar } from "@/components/landing/market/CoinAvatar";
import { GlobalStatsBar } from "@/components/landing/market/GlobalStatsBar";
import { InsightList } from "@/components/landing/market/InsightList";
import { MarketTable } from "@/components/landing/market/MarketTable";
import { formatUsd } from "@/lib/format";
import { getMarketOverviewData } from "@/lib/coingecko";
import type { MarketCoin } from "@/lib/coingecko";

function TopGainersList({ coins }: { coins: MarketCoin[] }) {
  return (
    <Card hover className="flex flex-col p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold sm:text-sm">Top Gainers</h3>
        <span className="text-[10px] font-medium text-secondary">24h</span>
      </div>

      <ul className="space-y-2.5">
        {coins.map((coin, index) => (
          <li key={coin.id} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-3 shrink-0 text-[10px] text-muted">{index + 1}</span>
              <CoinAvatar src={coin.image} symbol={coin.symbol} size={24} />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{coin.name}</p>
                <p className="text-[10px] text-muted">{coin.symbol}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium">{formatUsd(coin.price)}</p>
              <ChangeBadge value={coin.change24h} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

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
