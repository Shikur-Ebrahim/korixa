import { Card } from "@/components/ui/Card";
import { ChangeBadge } from "@/components/landing/market/ChangeBadge";
import { CoinAvatar } from "@/components/landing/market/CoinAvatar";
import { formatUsd } from "@/lib/format";
import type { MarketCoin } from "@/lib/coingecko";

export function TopGainersList({ coins }: { coins: MarketCoin[] }) {
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
