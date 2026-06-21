import { Card } from "@/components/ui/Card";
import { ChangeBadge } from "@/components/landing/market/ChangeBadge";
import { CoinAvatar } from "@/components/landing/market/CoinAvatar";
import { Sparkline } from "@/components/landing/market/Sparkline";
import { formatUsd } from "@/lib/format";
import type { MarketCoin } from "@/lib/coingecko";

type MarketTableProps = {
  coins: MarketCoin[];
};

export function MarketTable({ coins }: MarketTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-3 py-3 sm:px-4">
        <h3 className="text-xs font-semibold sm:text-sm">Top Cryptocurrencies</h3>
        <p className="mt-0.5 text-[10px] text-muted sm:text-xs">
          Prices by market cap · updated every 30 min
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left">
          <thead>
            <tr className="border-b border-border text-[10px] text-muted sm:text-xs">
              <th className="px-3 py-2 font-medium sm:px-4">#</th>
              <th className="px-2 py-2 font-medium">Coin</th>
              <th className="px-2 py-2 text-right font-medium">Price</th>
              <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">1h</th>
              <th className="px-2 py-2 text-right font-medium">24h</th>
              <th className="hidden px-2 py-2 text-right font-medium md:table-cell">7d</th>
              <th className="hidden px-2 py-2 text-right font-medium lg:table-cell">Volume</th>
              <th className="hidden px-2 py-2 text-right font-medium lg:table-cell">Mkt Cap</th>
              <th className="hidden px-3 py-2 font-medium xl:table-cell sm:px-4">7d</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => {
              const positive24h = (coin.change24h ?? 0) >= 0;

              return (
                <tr
                  key={coin.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2.5 text-[11px] text-muted sm:px-4 sm:text-xs">
                    {coin.rank}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex min-w-[120px] items-center gap-2">
                      <CoinAvatar src={coin.image} symbol={coin.symbol} size={26} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{coin.name}</p>
                        <p className="text-[10px] text-muted">{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right text-xs font-medium sm:text-sm">
                    {formatUsd(coin.price)}
                  </td>
                  <td className="hidden px-2 py-2.5 text-right sm:table-cell">
                    <ChangeBadge value={coin.change1h} />
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <ChangeBadge value={coin.change24h} />
                  </td>
                  <td className="hidden px-2 py-2.5 text-right md:table-cell">
                    <ChangeBadge value={coin.change7d} />
                  </td>
                  <td className="hidden px-2 py-2.5 text-right text-[11px] text-muted lg:table-cell sm:text-xs">
                    {formatUsd(coin.volume24h, true)}
                  </td>
                  <td className="hidden px-2 py-2.5 text-right text-[11px] text-muted lg:table-cell sm:text-xs">
                    {formatUsd(coin.marketCap, true)}
                  </td>
                  <td className="hidden px-3 py-2.5 xl:table-cell sm:px-4">
                    <Sparkline data={coin.sparkline} positive={positive24h} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
